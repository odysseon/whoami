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
        findByHash: mock.fn(),
        rotate: mock.fn(),
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

    it("should successfully rotate tokens atomically and hash dynamically", async () => {
      // Dynamic mock: Prepends 'hashed_' to whatever string is passed in
      mockDeps.tokenHasher.hash.mock.mockImplementation(
        async (input: string) => "hashed_" + input,
      );

      mockDeps.refreshTokenRepository.findByHash.mock.mockImplementation(
        async () => ({
          id: "token_record_1",
          userId: "user_123",
          tokenHash: "hashed_raw_old_refresh_token",
          expiresAt: validFutureDate,
          isRevoked: false,
        }),
      );

      mockDeps.refreshTokenRepository.rotate.mock.mockImplementation(
        async () => true,
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

      // Verify the atomic rotation was called correctly
      const rotateArgs =
        mockDeps.refreshTokenRepository.rotate.mock.calls[0].arguments;

      // Arg 0: Ensure it targeted the old hash
      assert.equal(rotateArgs[0], "hashed_raw_old_refresh_token");

      // Arg 1: Ensure the NEW hash corresponds to the newly generated raw token
      assert.equal(rotateArgs[1].userId, "user_123");
      assert.equal(rotateArgs[1].tokenHash, "hashed_" + result.refreshToken);
      assert.equal(rotateArgs[1].isRevoked, false);
      assert.equal(rotateArgs[1].id, undefined);
    });

    it("should trigger breach protocol if atomic rotation fails (race condition)", async () => {
      mockDeps.tokenHasher.hash.mock.mockImplementation(
        async () => "hashed_raw_old_token",
      );
      mockDeps.refreshTokenRepository.findByHash.mock.mockImplementation(
        async () => ({
          userId: "user_123",
          expiresAt: validFutureDate,
          isRevoked: false,
        }),
      );
      mockDeps.userRepository.findById.mock.mockImplementation(async () => ({
        id: "user_123",
      }));

      // Simulate another request consuming the token a millisecond before this one
      mockDeps.refreshTokenRepository.rotate.mock.mockImplementation(
        async () => false,
      );

      await assert.rejects(
        () => service.refreshTokens("raw_old_token"),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "INVALID_CREDENTIALS");
          return true;
        },
      );

      // Verify lockdown occurred
      const revokeArgs =
        mockDeps.refreshTokenRepository.revokeAllForUser.mock.calls[0]
          .arguments;
      assert.equal(revokeArgs[0], "user_123");
    });

    it("should throw INVALID_CREDENTIALS if token is not found", async () => {
      mockDeps.refreshTokenRepository.findByHash.mock.mockImplementation(
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
      mockDeps.refreshTokenRepository.findByHash.mock.mockImplementation(
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
      mockDeps.refreshTokenRepository.findByHash.mock.mockImplementation(
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

    it("should throw INVALID_CREDENTIALS when an empty string is provided", async () => {
      await assert.rejects(
        () => service.refreshTokens(""),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "INVALID_CREDENTIALS");
          assert.equal(err.message, "Invalid or expired refresh token.");
          return true;
        },
      );

      // Verify that no repository calls were made (early exit)
      assert.equal(mockDeps.tokenHasher.hash.mock.callCount(), 0);
      assert.equal(
        mockDeps.refreshTokenRepository.findByHash.mock.callCount(),
        0,
      );
    });

    it("should throw INVALID_CREDENTIALS when a whitespace-only string is provided", async () => {
      await assert.rejects(
        () => service.refreshTokens("   "),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "INVALID_CREDENTIALS");
          assert.equal(err.message, "Invalid or expired refresh token.");
          return true;
        },
      );

      // Verify early exit behavior
      assert.equal(mockDeps.tokenHasher.hash.mock.callCount(), 0);
      assert.equal(
        mockDeps.refreshTokenRepository.findByHash.mock.callCount(),
        0,
      );
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
