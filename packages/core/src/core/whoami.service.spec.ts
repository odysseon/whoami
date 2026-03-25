/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { WhoamiService } from "./whoami.service.js";
import {
  IUserWithEmail,
  IUserWithProvider,
} from "../interfaces/models/user.interface.js";

describe("WhoamiService (Facade & Sub-services)", () => {
  let mockDeps: any;
  let service: WhoamiService;

  beforeEach(() => {
    mockDeps = {
      tokenSigner: {
        sign: async (): Promise<string> => "access_token",
        verify: async (): Promise<object> => ({ sub: "user_123" }),
      },
      tokenHasher: {
        hash: async (): Promise<string> => "hashed_token",
        verify: async (): Promise<boolean> => true,
      },
      passwordHasher: {
        hash: async (): Promise<string> => "hashed_password",
        verify: async (): Promise<boolean> => true,
      },
      logger: {
        info: (): void => {},
        warn: (): void => {},
        error: (): void => {},
        debug: (): void => {},
      },
      passwordUserRepository: {
        findById: async (): Promise<null> => null,
        findByEmail: async (): Promise<null> => null,
        createWithEmail: async (): Promise<IUserWithEmail> => ({
          id: "user_123",
          email: "test@example.com",
        }),
        updatePassword: async (): Promise<void> => {},
      },
      oauthUserRepository: {
        findById: async (): Promise<null> => null,
        findByProviderId: async (): Promise<null> => null,
        createWithProvider: async (): Promise<IUserWithProvider> => ({
          id: "user_123",
          provider: "google",
          providerId: "g123",
        }),
        linkProvider: async (): Promise<void> => {},
      },
      refreshTokenRepository: {
        store: async (): Promise<void> => {},
        findByHash: async (): Promise<null> => null,
        rotate: async (): Promise<boolean> => true,
        revokeAllForUser: async (): Promise<void> => {},
      },
      configuration: {
        authMethods: { credentials: true, oauth: true },
        refreshTokens: { enabled: true },
      },
    };
    service = new WhoamiService(mockDeps);
  });

  describe("ConfigurationValidator", () => {
    it("should throw if accessTokenTtlSeconds is <= 0", () => {
      mockDeps.configuration.accessTokenTtlSeconds = 0;
      assert.throws(
        () => new WhoamiService(mockDeps),
        /accessTokenTtlSeconds must be/,
      );
    });

    it("should throw if refreshTokenTtlSeconds is <= 0 while enabled", () => {
      mockDeps.configuration.refreshTokenTtlSeconds = 0;
      assert.throws(
        () => new WhoamiService(mockDeps),
        /refreshTokenTtlSeconds must be/,
      );
    });

    it("should throw ambiguity error if credentials providers exist but config is unspecified", () => {
      mockDeps.configuration.authMethods.credentials = undefined;
      assert.throws(
        () => new WhoamiService(mockDeps),
        /Explicitly set authMethods.credentials/,
      );
    });

    it("should throw ambiguity error if refresh providers exist but config is unspecified", () => {
      mockDeps.configuration.refreshTokens.enabled = undefined;
      assert.throws(
        () => new WhoamiService(mockDeps),
        /Explicitly set refreshTokens.enabled/,
      );
    });

    it("should default to unspecified state logging if no configuration object is provided", () => {
      const minimalDeps = {
        tokenSigner: mockDeps.tokenSigner,
        logger: mockDeps.logger,
      };
      const tempService = new WhoamiService(minimalDeps);
      const status = tempService.getAuthStatus();
      assert.equal(status.authMethods.credentials, false);
      assert.equal(status.authMethods.oauth, false);
      assert.equal(status.refreshTokens, false);
    });
  });

  describe("CredentialAuthenticator", () => {
    it("should register a new user", async () => {
      const user = await service.registerWithEmail({
        email: "test@example.com",
        password: "password123",
      });
      assert.equal(user.email, "test@example.com");
    });

    it("should throw if password is empty on register", async () => {
      await assert.rejects(
        () =>
          service.registerWithEmail({
            email: "test@example.com",
            password: "   ",
          }),
        /Empty password/,
      );
    });

    it("should throw if user already exists on register", async () => {
      mockDeps.passwordUserRepository.findByEmail = async () => ({
        id: "existing",
      });
      await assert.rejects(
        () =>
          service.registerWithEmail({
            email: "test@example.com",
            password: "password123",
          }),
        /Email taken/,
      );
    });

    it("should login successfully and return tokens", async () => {
      mockDeps.passwordUserRepository.findByEmail = async () => ({
        id: "user_123",
        passwordHash: "hash",
      });
      const tokens = await service.loginWithEmail({
        email: "test@example.com",
        password: "password123",
      });
      assert.ok(tokens.accessToken);
      assert.ok(tokens.refreshToken);
    });

    it("should throw on login if user not found", async () => {
      await assert.rejects(
        () =>
          service.loginWithEmail({
            email: "wrong@example.com",
            password: "password123",
          }),
        /Invalid email or password/,
      );
    });

    it("should throw on login if password is wrong", async () => {
      mockDeps.passwordUserRepository.findByEmail = async () => ({
        id: "user_123",
        passwordHash: "hash",
      });
      mockDeps.passwordHasher.verify = async () => false;
      await assert.rejects(
        () =>
          service.loginWithEmail({
            email: "test@example.com",
            password: "wrong",
          }),
        /Invalid email or password/,
      );
    });

    it("should throw on login if password is empty", async () => {
      await assert.rejects(
        () =>
          service.loginWithEmail({
            email: "test@example.com",
            password: "   ",
          }),
        /Invalid email or password/,
      );
    });

    it("should successfully update password", async () => {
      mockDeps.passwordUserRepository.findById = async () => ({
        id: "user_123",
      });
      await assert.doesNotReject(() =>
        service.updatePassword("user_123", "new_password"),
      );
    });

    it("should throw on update password if user not found", async () => {
      await assert.rejects(
        () => service.updatePassword("ghost_id", "new_password"),
        /User missing/,
      );
    });

    it("should throw on update password if password is empty", async () => {
      await assert.rejects(
        () => service.updatePassword("user_123", "   "),
        /Empty password/,
      );
    });

    it("should throw if credentials auth is disabled", async () => {
      mockDeps.configuration.authMethods.credentials = false;
      service = new WhoamiService(mockDeps);
      await assert.rejects(
        () =>
          service.loginWithEmail({
            email: "test@example.com",
            password: "password",
          }),
        /Credentials disabled/,
      );
    });

    it("should throw if credential dependencies are missing at runtime", async () => {
      delete mockDeps.passwordUserRepository;
      service = new WhoamiService(mockDeps);
      await assert.rejects(
        () =>
          service.loginWithEmail({
            email: "test@example.com",
            password: "password123",
          }),
        /Missing credential dependencies/,
      );
    });
  });

  describe("OAuthAuthenticator", () => {
    const validOAuthData = {
      provider: "google",
      providerId: "g123",
      email: "test@example.com",
    };

    it("should register a new user if provider ID is unseen", async () => {
      const tokens = await service.loginWithOAuth(validOAuthData);
      assert.ok(tokens.accessToken);
    });

    it("should login an existing user if provider ID matches", async () => {
      mockDeps.oauthUserRepository.findByProviderId = async () => ({
        id: "existing_user",
      });
      const tokens = await service.loginWithOAuth(validOAuthData);
      assert.ok(tokens.accessToken);
    });

    it("should link a new provider to an existing user", async () => {
      await assert.doesNotReject(() =>
        service.linkOAuthProvider("user_123", validOAuthData),
      );
    });

    it("should throw on link if provider belongs to another user", async () => {
      mockDeps.oauthUserRepository.findByProviderId = async () => ({
        id: "different_user",
      });
      await assert.rejects(
        () => service.linkOAuthProvider("user_123", validOAuthData),
        /Provider linked to another user/,
      );
    });

    it("should throw if oauth data is missing provider", async () => {
      await assert.rejects(
        () => service.loginWithOAuth({ provider: "", providerId: "g123" }),
        /Provider and Provider ID required/,
      );
    });

    it("should throw if OAuth is disabled", async () => {
      mockDeps.configuration.authMethods.oauth = false;
      service = new WhoamiService(mockDeps);
      await assert.rejects(
        () => service.loginWithOAuth(validOAuthData),
        /OAuth disabled/,
      );
    });

    it("should throw if OAuth dependencies are missing at runtime", async () => {
      delete mockDeps.oauthUserRepository;
      service = new WhoamiService(mockDeps);
      await assert.rejects(
        () => service.loginWithOAuth(validOAuthData),
        /Missing OAuth dependencies/,
      );
    });
  });

  describe("TokenOrchestrator", () => {
    it("should only issue an access token if refresh tokens are disabled", async () => {
      mockDeps.configuration.refreshTokens.enabled = false;
      mockDeps.passwordUserRepository.findByEmail = async () => ({
        id: "user_123",
        passwordHash: "hash",
      });
      service = new WhoamiService(mockDeps);

      const tokens = await service.loginWithEmail({
        email: "test@example.com",
        password: "password123",
      });
      assert.ok(tokens.accessToken);
      assert.equal(tokens.refreshToken, undefined);
    });

    it("should throw if refresh tokens are disabled during a refresh attempt", async () => {
      mockDeps.configuration.refreshTokens.enabled = false;
      service = new WhoamiService(mockDeps);
      await assert.rejects(
        () => service.refreshTokens("some_token"),
        /Refresh tokens disabled/,
      );
    });

    it("should refresh tokens successfully", async () => {
      mockDeps.refreshTokenRepository.findByHash = async () => ({
        userId: "user_123",
        isRevoked: false,
        expiresAt: new Date(Date.now() + 10000),
      });
      mockDeps.passwordUserRepository.findById = async () => ({
        id: "user_123",
      });

      const tokens = await service.refreshTokens("valid_raw_token");
      assert.ok(tokens.accessToken);
      assert.ok(tokens.refreshToken);
    });

    it("should throw if refresh token string is empty", async () => {
      await assert.rejects(() => service.refreshTokens("   "), /Invalid token/);
    });

    it("should throw if refresh token dependencies are missing during token issuance", async () => {
      delete mockDeps.refreshTokenRepository;
      service = new WhoamiService(mockDeps);
      // Mock the login process to trigger token issuance
      mockDeps.passwordUserRepository.findByEmail = async () => ({
        id: "user_123",
        passwordHash: "hash",
      });

      await assert.rejects(
        () =>
          service.loginWithEmail({
            email: "test@example.com",
            password: "password123",
          }),
        /Missing refresh token dependencies/,
      );
    });

    it("should throw and revoke if token is already revoked (Reuse Detection)", async () => {
      let revokedUserId = "";
      mockDeps.refreshTokenRepository.findByHash = async () => ({
        userId: "user_123",
        isRevoked: true,
      });
      mockDeps.refreshTokenRepository.revokeAllForUser = async (id: string) => {
        revokedUserId = id;
      };

      await assert.rejects(
        () => service.refreshTokens("revoked_token"),
        /Token revoked/,
      );
      assert.equal(revokedUserId, "user_123");
    });

    it("should throw if token is expired", async () => {
      mockDeps.refreshTokenRepository.findByHash = async () => ({
        userId: "user_123",
        isRevoked: false,
        expiresAt: new Date(Date.now() - 10000), // Past
      });
      await assert.rejects(
        () => service.refreshTokens("expired_token"),
        /Token expired/,
      );
    });

    it("should throw and revoke if atomic rotation fails (Race Condition)", async () => {
      mockDeps.refreshTokenRepository.findByHash = async () => ({
        userId: "user_123",
        isRevoked: false,
        expiresAt: new Date(Date.now() + 10000),
      });
      mockDeps.passwordUserRepository.findById = async () => ({
        id: "user_123",
      });
      mockDeps.refreshTokenRepository.rotate = async () => false;

      await assert.rejects(
        () => service.refreshTokens("valid_token"),
        /Reuse detected/,
      );
    });

    it("should throw if refresh token record is not found in database", async () => {
      // Simulate a token that passes format checks but doesn't exist in the DB
      mockDeps.refreshTokenRepository.findByHash = async () => null;

      await assert.rejects(
        () => service.refreshTokens("valid_format_but_unknown_token"),
        /Invalid token/,
      );
    });

    it("should throw if user is deleted before refresh", async () => {
      mockDeps.refreshTokenRepository.findByHash = async () => ({
        userId: "ghost_user",
        isRevoked: false,
        expiresAt: new Date(Date.now() + 10000),
      });
      await assert.rejects(
        () => service.refreshTokens("valid_token"),
        /User missing/,
      );
    });

    it("should throw if refresh token dependencies are missing at runtime", async () => {
      delete mockDeps.refreshTokenRepository;
      service = new WhoamiService(mockDeps);
      await assert.rejects(
        () => service.refreshTokens("valid_raw_token"),
        /Missing refresh token dependencies/,
      );
    });

    it("should successfully verify an access token", async () => {
      const payload = await service.verifyAccessToken("some.jwt.token");
      assert.equal(payload.sub, "user_123");
    });
  });

  it("should refresh tokens successfully for an OAuth-only user", async () => {
    mockDeps.refreshTokenRepository.findByHash = async () => ({
      userId: "oauth_user_123",
      isRevoked: false,
      expiresAt: new Date(Date.now() + 10000),
    });
    // The Password repo returns null, forcing the router to fall back to the OAuth repo
    mockDeps.passwordUserRepository.findById = async () => null;
    mockDeps.oauthUserRepository.findById = async () => ({
      id: "oauth_user_123",
    });

    const tokens = await service.refreshTokens("valid_raw_token");
    assert.ok(tokens.accessToken);
  });

  describe("Facade Internal Router (findUserById)", () => {
    it("should route directly to OAuth repo if password repo is completely undefined", async () => {
      delete mockDeps.passwordUserRepository;
      mockDeps.refreshTokenRepository.findByHash = async () => ({
        userId: "oauth_user_123",
        isRevoked: false,
        expiresAt: new Date(Date.now() + 10000),
      });
      mockDeps.oauthUserRepository.findById = async () => ({
        id: "oauth_user_123",
      });

      // Create a fresh service with the deleted password repo
      const customService = new WhoamiService(mockDeps);
      const tokens = await customService.refreshTokens("valid_raw_token");

      assert.ok(tokens.accessToken);
    });

    it("should return null (and throw) if user is not in password repo and OAuth repo is undefined", async () => {
      delete mockDeps.oauthUserRepository;
      mockDeps.refreshTokenRepository.findByHash = async () => ({
        userId: "ghost_user",
        isRevoked: false,
        expiresAt: new Date(Date.now() + 10000),
      });
      mockDeps.passwordUserRepository.findById = async () => null;

      const customService = new WhoamiService(mockDeps);

      await assert.rejects(
        () => customService.refreshTokens("valid_raw_token"),
        /User missing/,
      );
    });
  });
});
