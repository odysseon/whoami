import { describe, it, mock, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import {
  WhoamiService,
  type WhoamiServiceDependencies,
} from "./whoami.service.js";
import { WhoamiError } from "../errors/whoami-error.js";

describe("WhoamiService - Registration", () => {
  let service: WhoamiService;
  // Use a generic Record instead of 'any' to appease ESLint while
  // keeping the mock setup flexible.
  let mockDeps: Record<string, Record<string, ReturnType<typeof mock.fn>>>;

  beforeEach(() => {
    mockDeps = {
      userRepository: {
        findById: mock.fn(),
        findByEmail: mock.fn(),
        create: mock.fn(),
      },
      refreshTokenRepository: {
        store: mock.fn(),
        consume: mock.fn(),
        revokeAllForUser: mock.fn(),
      },
      passwordHasher: { hash: mock.fn(), verify: mock.fn() },
      tokenHasher: { hash: mock.fn(), verify: mock.fn() },
      tokenSigner: { sign: mock.fn(), verify: mock.fn() },
      logger: { info: mock.fn(), warn: mock.fn(), error: mock.fn() },
    };

    // Cast through unknown to bypass the strict dependency typing for our mocks
    service = new WhoamiService(
      mockDeps as unknown as WhoamiServiceDependencies,
    );
  });

  it("should successfully register a new user", async () => {
    mockDeps.userRepository.findByEmail.mock.mockImplementation(
      async () => null,
    );
    mockDeps.passwordHasher.hash.mock.mockImplementation(
      async () => "hashed_password_123",
    );
    mockDeps.userRepository.create.mock.mockImplementation(
      // Strictly typed argument instead of 'any'
      async (data: { email: string }) => ({
        id: "user_123",
        email: data.email,
      }),
    );

    const result = await service.registerWithEmail({
      email: "test@odysseon.com",
      password: "supersecretpassword",
    });

    assert.equal(result.id, "user_123");
    assert.equal(result.email, "test@odysseon.com");

    assert.equal(
      mockDeps.passwordHasher.hash.mock.calls[0].arguments[0],
      "supersecretpassword",
    );

    const createArgs =
      mockDeps.userRepository.create.mock.calls[0].arguments[0];
    assert.equal(createArgs.email, "test@odysseon.com");
    assert.equal(createArgs.passwordHash, "hashed_password_123");
  });

  it("should throw USER_ALREADY_EXISTS if the email is taken", async () => {
    mockDeps.userRepository.findByEmail.mock.mockImplementation(async () => ({
      id: "existing_user_999",
      email: "test@odysseon.com",
    }));

    await assert.rejects(
      () =>
        service.registerWithEmail({
          email: "test@odysseon.com",
          password: "password",
        }),
      // Use unknown and narrow the type safely
      (err: unknown) => {
        assert.ok(err instanceof WhoamiError);
        assert.equal(err.code, "USER_ALREADY_EXISTS");
        return true;
      },
    );

    assert.equal(mockDeps.passwordHasher.hash.mock.callCount(), 0);
    assert.equal(mockDeps.userRepository.create.mock.callCount(), 0);
  });

  describe("Login Flow", () => {
    it("should successfully log in and return tokens", async () => {
      mockDeps.userRepository.findByEmail.mock.mockImplementation(async () => ({
        id: "user_123",
        email: "test@odysseon.com",
        passwordHash: "hashed_db_password",
      }));
      mockDeps.passwordHasher.verify.mock.mockImplementation(async () => true);
      mockDeps.tokenSigner.sign.mock.mockImplementation(
        async () => "mock_jwt_access_token",
      );
      mockDeps.tokenHasher.hash.mock.mockImplementation(
        async () => "hashed_refresh_token_string",
      );
      mockDeps.refreshTokenRepository.store.mock.mockImplementation(
        async () => {},
      );

      const result = await service.loginWithEmail({
        email: "test@odysseon.com",
        password: "correct_password",
      });

      assert.equal(result.accessToken, "mock_jwt_access_token");
      assert.ok(result.refreshToken);

      const verifyArgs = mockDeps.passwordHasher.verify.mock.calls[0].arguments;
      assert.equal(verifyArgs[0], "hashed_db_password");
      assert.equal(verifyArgs[1], "correct_password");

      const signArgs = mockDeps.tokenSigner.sign.mock.calls[0].arguments;
      assert.deepEqual(signArgs[0], { sub: "user_123" });

      const storeArgs =
        mockDeps.refreshTokenRepository.store.mock.calls[0].arguments[0];
      assert.equal(storeArgs.tokenHash, "hashed_refresh_token_string");
      assert.equal(storeArgs.userId, "user_123");
      assert.equal(storeArgs.isRevoked, false);
    });

    it("should throw INVALID_CREDENTIALS if the user does not exist", async () => {
      mockDeps.userRepository.findByEmail.mock.mockImplementation(
        async () => null,
      );

      await assert.rejects(
        () =>
          service.loginWithEmail({
            email: "ghost@odysseon.com",
            password: "password",
          }),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "INVALID_CREDENTIALS");
          return true;
        },
      );

      assert.equal(mockDeps.passwordHasher.verify.mock.callCount(), 0);
    });

    it("should throw INVALID_CREDENTIALS if the password does not match", async () => {
      mockDeps.userRepository.findByEmail.mock.mockImplementation(async () => ({
        id: "user_123",
        passwordHash: "real_hash",
      }));
      mockDeps.passwordHasher.verify.mock.mockImplementation(async () => false);

      await assert.rejects(
        () =>
          service.loginWithEmail({
            email: "test@odysseon.com",
            password: "wrong_password",
          }),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "INVALID_CREDENTIALS");
          return true;
        },
      );

      assert.equal(mockDeps.tokenSigner.sign.mock.callCount(), 0);
    });
  });

  describe("Refresh Tokens Flow", () => {
    const validFutureDate = new Date(Date.now() + 100000);
    const pastDate = new Date(Date.now() - 100000);

    it("should successfully rotate tokens on valid refresh", async () => {
      mockDeps.tokenHasher.hash.mock.mockImplementation(
        async () => "hashed_incoming_token",
      );
      mockDeps.refreshTokenRepository.consume.mock.mockImplementation(
        async () => ({
          id: "token_record_1",
          userId: "user_123",
          tokenHash: "hashed_incoming_token",
          expiresAt: validFutureDate,
          isRevoked: false,
        }),
      );
      mockDeps.userRepository.findById.mock.mockImplementation(async () => ({
        id: "user_123",
      }));
      mockDeps.tokenSigner.sign.mock.mockImplementation(
        async () => "new_access_token",
      );

      const result = await service.refreshTokens("raw_old_refresh_token");

      assert.equal(result.accessToken, "new_access_token");
      assert.ok(result.refreshToken);

      const findArgs = mockDeps.userRepository.findById.mock.calls[0].arguments;
      assert.equal(findArgs[0], "user_123");

      const storeArgs =
        mockDeps.refreshTokenRepository.store.mock.calls[0].arguments[0];
      assert.equal(storeArgs.userId, "user_123");
      assert.equal(storeArgs.tokenHash, "hashed_incoming_token");
      assert.equal(storeArgs.isRevoked, false);
      assert.equal(storeArgs.id, undefined);
    });

    it("should throw INVALID_CREDENTIALS if token is not found or already consumed", async () => {
      mockDeps.tokenHasher.hash.mock.mockImplementation(
        async () => "hashed_fake_token",
      );
      mockDeps.refreshTokenRepository.consume.mock.mockImplementation(
        async () => null,
      );

      await assert.rejects(
        () => service.refreshTokens("raw_fake_token"),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "INVALID_CREDENTIALS");
          return true;
        },
      );
    });

    it("should throw TOKEN_EXPIRED if the token is past its expiration date", async () => {
      mockDeps.refreshTokenRepository.consume.mock.mockImplementation(
        async () => ({
          userId: "user_123",
          expiresAt: pastDate,
          isRevoked: false,
        }),
      );

      await assert.rejects(
        () => service.refreshTokens("raw_expired_token"),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "TOKEN_EXPIRED");
          return true;
        },
      );
    });

    it("should nuke sessions and throw if a revoked token is used", async () => {
      mockDeps.refreshTokenRepository.consume.mock.mockImplementation(
        async () => ({
          userId: "user_hacker",
          expiresAt: validFutureDate,
          isRevoked: true,
        }),
      );

      await assert.rejects(
        () => service.refreshTokens("raw_stolen_token"),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "INVALID_CREDENTIALS");
          return true;
        },
      );

      const revokeArgs =
        mockDeps.refreshTokenRepository.revokeAllForUser.mock.calls[0]
          .arguments;
      assert.equal(revokeArgs[0], "user_hacker");
    });
  });

  describe("Verify Access Token", () => {
    it("should successfully verify and return the payload", async () => {
      mockDeps.tokenSigner.verify.mock.mockImplementation(async () => ({
        sub: "user_123",
      }));

      const result = await service.verifyAccessToken("valid_jwt_string");

      assert.equal(result.sub, "user_123");

      const verifyArgs = mockDeps.tokenSigner.verify.mock.calls[0].arguments;
      assert.equal(verifyArgs[0], "valid_jwt_string");
    });

    it("should bubble up errors from the signer adapter", async () => {
      mockDeps.tokenSigner.verify.mock.mockImplementation(async () => {
        throw new WhoamiError("TOKEN_EXPIRED", "Token is dead.");
      });

      await assert.rejects(
        () => service.verifyAccessToken("expired_jwt_string"),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "TOKEN_EXPIRED");
          return true;
        },
      );
    });
  });
});
