import { describe, it, mock } from "node:test";
import { strict as assert } from "node:assert";
import {
  WhoamiService,
  type WhoamiServiceDependencies,
} from "./whoami.service.js";
import { WhoamiError } from "../errors/whoami-error.js";
import type { IWhoamiAuthConfiguration } from "../interfaces/operation-contracts/auth-configuration.interface.js";

type MockFn = ReturnType<typeof mock.fn>;

interface MockedDependencies {
  userRepository: {
    findById: MockFn;
    findByEmail: MockFn;
    create: MockFn;
  };
  googleUserRepository: {
    findById: MockFn;
    resolveGoogleUser: MockFn;
  };
  refreshTokenRepository: {
    store: MockFn;
    findByHash: MockFn;
    rotate: MockFn;
    revokeAllForUser: MockFn;
  };
  passwordHasher: {
    hash: MockFn;
    verify: MockFn;
  };
  tokenHasher: {
    hash: MockFn;
  };
  tokenSigner: {
    sign: MockFn;
    verify: MockFn;
  };
  googleIdTokenVerifier: {
    verify: MockFn;
  };
  logger: {
    info: MockFn;
    warn: MockFn;
    error: MockFn;
  };
}

function createMockedDependencies(): MockedDependencies {
  return {
    userRepository: {
      findById: mock.fn(async (id: string) => ({ id })),
      findByEmail: mock.fn(async () => null),
      create: mock.fn(async (data: { email: string }) => ({
        id: "user_123",
        email: data.email,
      })),
    },
    googleUserRepository: {
      findById: mock.fn(async () => null),
      resolveGoogleUser: mock.fn(async () => ({ id: "google_user_123" })),
    },
    refreshTokenRepository: {
      store: mock.fn(async () => {}),
      findByHash: mock.fn(async () => null),
      rotate: mock.fn(async () => true),
      revokeAllForUser: mock.fn(async () => {}),
    },
    passwordHasher: {
      hash: mock.fn(async () => "hashed_password"),
      verify: mock.fn(async () => true),
    },
    tokenHasher: {
      hash: mock.fn(async (value: string) => `hash:${value}`),
    },
    tokenSigner: {
      sign: mock.fn(async () => "signed_access_token"),
      verify: mock.fn(async () => ({ sub: "user_123" })),
    },
    googleIdTokenVerifier: {
      verify: mock.fn(async () => ({
        sub: "google-sub-123",
        email: "google@odysseon.com",
        emailVerified: true,
      })),
    },
    logger: {
      info: mock.fn(() => {}),
      warn: mock.fn(() => {}),
      error: mock.fn(() => {}),
    },
  };
}

function createService(options?: {
  configuration?: IWhoamiAuthConfiguration;
  omit?: Partial<Record<keyof WhoamiServiceDependencies, true>>;
  mockedDependencies?: MockedDependencies;
}): {
  service: WhoamiService;
  mockedDependencies: MockedDependencies;
} {
  const mockedDependencies =
    options?.mockedDependencies ?? createMockedDependencies();
  const configuration: IWhoamiAuthConfiguration = options?.configuration ?? {
    authMethods: {
      credentials: true,
      googleOAuth: true,
    },
    refreshTokens: {
      enabled: true,
    },
  };

  const deps: WhoamiServiceDependencies = {
    userRepository: options?.omit?.userRepository
      ? undefined
      : (mockedDependencies.userRepository as unknown as WhoamiServiceDependencies["userRepository"]),
    googleUserRepository: options?.omit?.googleUserRepository
      ? undefined
      : (mockedDependencies.googleUserRepository as unknown as WhoamiServiceDependencies["googleUserRepository"]),
    refreshTokenRepository: options?.omit?.refreshTokenRepository
      ? undefined
      : (mockedDependencies.refreshTokenRepository as unknown as WhoamiServiceDependencies["refreshTokenRepository"]),
    passwordHasher: options?.omit?.passwordHasher
      ? undefined
      : (mockedDependencies.passwordHasher as unknown as WhoamiServiceDependencies["passwordHasher"]),
    tokenHasher: options?.omit?.tokenHasher
      ? undefined
      : (mockedDependencies.tokenHasher as unknown as WhoamiServiceDependencies["tokenHasher"]),
    tokenSigner:
      mockedDependencies.tokenSigner as unknown as WhoamiServiceDependencies["tokenSigner"],
    googleIdTokenVerifier: options?.omit?.googleIdTokenVerifier
      ? undefined
      : (mockedDependencies.googleIdTokenVerifier as unknown as WhoamiServiceDependencies["googleIdTokenVerifier"]),
    logger:
      mockedDependencies.logger as unknown as WhoamiServiceDependencies["logger"],
    configuration,
  };

  return {
    service: new WhoamiService(deps),
    mockedDependencies,
  };
}

describe("WhoamiService", () => {
  it("should return explicitly enabled auth methods and log their statuses", () => {
    const { service, mockedDependencies } = createService();

    assert.deepEqual(service.getAuthStatus(), {
      authMethods: {
        credentials: true,
        googleOAuth: true,
      },
      refreshTokens: true,
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: 604800,
    });
    assert.equal(mockedDependencies.logger.info.mock.callCount(), 3);
    assert.equal(mockedDependencies.logger.warn.mock.callCount(), 0);
    assert.equal(
      mockedDependencies.logger.info.mock.calls[0].arguments[0],
      "Credentials authentication status",
    );
    assert.equal(
      mockedDependencies.logger.info.mock.calls[1].arguments[0],
      "Google OAuth authentication status",
    );
    assert.equal(
      mockedDependencies.logger.info.mock.calls[2].arguments[0],
      "Refresh token status",
    );
  });

  it("should return a defensive copy of auth status", () => {
    const { service } = createService();
    const status = service.getAuthStatus();

    status.authMethods.credentials = false;

    assert.equal(service.getAuthStatus().authMethods.credentials, true);
  });

  it("should honor explicit disabled auth methods and refresh token settings", () => {
    const { service } = createService({
      configuration: {
        authMethods: {
          credentials: false,
          googleOAuth: false,
        },
        refreshTokens: {
          enabled: false,
        },
        accessTokenTtlSeconds: 3600,
      },
    });

    assert.deepEqual(service.getAuthStatus(), {
      authMethods: {
        credentials: false,
        googleOAuth: false,
      },
      refreshTokens: false,
      accessTokenTtlSeconds: 3600,
      refreshTokenTtlSeconds: null,
    });
  });

  it("should default to all auth methods disabled when no configuration is provided", () => {
    const mockedDependencies = createMockedDependencies();
    const service = new WhoamiService({
      tokenSigner:
        mockedDependencies.tokenSigner as unknown as WhoamiServiceDependencies["tokenSigner"],
      logger:
        mockedDependencies.logger as unknown as WhoamiServiceDependencies["logger"],
    });

    assert.deepEqual(service.getAuthStatus(), {
      authMethods: {
        credentials: false,
        googleOAuth: false,
      },
      refreshTokens: false,
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: null,
    });
    assert.equal(mockedDependencies.logger.warn.mock.callCount(), 1);
  });

  it("should fail fast when credential providers are supplied without explicit auth configuration", () => {
    const mockedDependencies = createMockedDependencies();

    assert.throws(
      () =>
        new WhoamiService({
          userRepository:
            mockedDependencies.userRepository as unknown as WhoamiServiceDependencies["userRepository"],
          passwordHasher:
            mockedDependencies.passwordHasher as unknown as WhoamiServiceDependencies["passwordHasher"],
          tokenSigner:
            mockedDependencies.tokenSigner as unknown as WhoamiServiceDependencies["tokenSigner"],
          logger:
            mockedDependencies.logger as unknown as WhoamiServiceDependencies["logger"],
        }),
      (error: unknown) => {
        assert.ok(error instanceof WhoamiError);
        assert.equal(error.code, "INVALID_CONFIGURATION");
        assert.match(error.message, /authMethods\.credentials/);
        return true;
      },
    );
  });

  it("should fail fast when refresh token providers are supplied without explicit refresh configuration", () => {
    const mockedDependencies = createMockedDependencies();

    assert.throws(
      () =>
        new WhoamiService({
          tokenSigner:
            mockedDependencies.tokenSigner as unknown as WhoamiServiceDependencies["tokenSigner"],
          logger:
            mockedDependencies.logger as unknown as WhoamiServiceDependencies["logger"],
          refreshTokenRepository:
            mockedDependencies.refreshTokenRepository as unknown as WhoamiServiceDependencies["refreshTokenRepository"],
          tokenHasher:
            mockedDependencies.tokenHasher as unknown as WhoamiServiceDependencies["tokenHasher"],
        }),
      (error: unknown) => {
        assert.ok(error instanceof WhoamiError);
        assert.equal(error.code, "INVALID_CONFIGURATION");
        assert.match(error.message, /refreshTokens\.enabled/);
        return true;
      },
    );
  });

  it("should throw when access token TTL is invalid", () => {
    assert.throws(
      () =>
        createService({
          configuration: {
            authMethods: {
              credentials: false,
              googleOAuth: false,
            },
            refreshTokens: {
              enabled: false,
            },
            accessTokenTtlSeconds: 0,
          },
        }),
      /accessTokenTtlSeconds/,
    );
  });

  it("should throw when refresh token TTL is invalid while refresh tokens are enabled", () => {
    assert.throws(
      () =>
        createService({
          configuration: {
            authMethods: {
              credentials: false,
              googleOAuth: false,
            },
            refreshTokens: { enabled: true },
            refreshTokenTtlSeconds: 0,
          },
        }),
      /refreshTokenTtlSeconds/,
    );
  });

  it("should throw when credentials auth is enabled without credential dependencies", () => {
    assert.throws(
      () =>
        createService({
          configuration: {
            authMethods: { credentials: true, googleOAuth: false },
            refreshTokens: { enabled: false },
          },
          omit: {
            userRepository: true,
          },
        }),
      /userRepository/,
    );
  });

  it("should throw when Google OAuth is enabled without its dependencies", () => {
    assert.throws(
      () =>
        createService({
          configuration: {
            authMethods: { credentials: false, googleOAuth: true },
            refreshTokens: { enabled: false },
          },
          omit: {
            googleIdTokenVerifier: true,
          },
        }),
      /googleIdTokenVerifier/,
    );
  });

  it("should throw when refresh tokens are enabled without refresh dependencies", () => {
    assert.throws(
      () =>
        createService({
          configuration: {
            authMethods: { credentials: false, googleOAuth: false },
            refreshTokens: { enabled: true },
          },
          omit: {
            refreshTokenRepository: true,
          },
        }),
      /refreshTokenRepository/,
    );
  });

  it("should register a new email user", async () => {
    const { service, mockedDependencies } = createService();

    const result = await service.registerWithEmail({
      email: "test@odysseon.com",
      password: "supersecretpassword",
    });

    assert.equal(result.id, "user_123");
    assert.equal(result.email, "test@odysseon.com");
    assert.equal(
      mockedDependencies.passwordHasher.hash.mock.calls[0].arguments[0],
      "supersecretpassword",
    );
    assert.equal(
      mockedDependencies.userRepository.create.mock.calls[0].arguments[0]
        .passwordHash,
      "hashed_password",
    );
  });

  it("should reject registration when credentials authentication is disabled", async () => {
    const { service, mockedDependencies } = createService({
      configuration: {
        authMethods: { credentials: false, googleOAuth: false },
        refreshTokens: { enabled: false },
      },
    });

    await assert.rejects(
      () =>
        service.registerWithEmail({
          email: "test@odysseon.com",
          password: "password",
        }),
      (error: unknown) => {
        assert.ok(error instanceof WhoamiError);
        assert.equal(error.code, "AUTH_METHOD_DISABLED");
        return true;
      },
    );

    assert.equal(
      mockedDependencies.userRepository.findByEmail.mock.callCount(),
      0,
    );
  });

  it("should reject registration with empty password", async () => {
    const { service } = createService();

    await assert.rejects(
      () =>
        service.registerWithEmail({
          email: "test@odysseon.com",
          password: " ",
        }),
      (error: unknown) => {
        assert.ok(error instanceof WhoamiError);
        assert.equal(error.code, "INVALID_CREDENTIALS");
        return true;
      },
    );
  });

  it("should reject registration when the email already exists", async () => {
    const mockedDependencies = createMockedDependencies();
    mockedDependencies.userRepository.findByEmail.mock.mockImplementation(
      async () => ({
        id: "user_existing",
        email: "test@odysseon.com",
        passwordHash: "already_hashed",
      }),
    );

    const { service } = createService({ mockedDependencies });

    await assert.rejects(
      () =>
        service.registerWithEmail({
          email: "test@odysseon.com",
          password: "password",
        }),
      (error: unknown) => {
        assert.ok(error instanceof WhoamiError);
        assert.equal(error.code, "USER_ALREADY_EXISTS");
        return true;
      },
    );
  });

  it("should log in with email and issue refresh tokens when enabled", async () => {
    const mockedDependencies = createMockedDependencies();
    mockedDependencies.userRepository.findByEmail.mock.mockImplementation(
      async () => ({
        id: "user_123",
        email: "test@odysseon.com",
        passwordHash: "stored_hash",
      }),
    );

    const { service } = createService({ mockedDependencies });
    const result = await service.loginWithEmail({
      email: "test@odysseon.com",
      password: "correct_password",
    });

    assert.equal(result.accessToken, "signed_access_token");
    assert.ok(typeof result.refreshToken === "string");
    assert.equal(
      mockedDependencies.refreshTokenRepository.store.mock.callCount(),
      1,
    );
  });

  it("should log in with email without refresh token when refresh tokens are disabled", async () => {
    const mockedDependencies = createMockedDependencies();
    mockedDependencies.userRepository.findByEmail.mock.mockImplementation(
      async () => ({
        id: "user_123",
        email: "test@odysseon.com",
        passwordHash: "stored_hash",
      }),
    );

    const { service } = createService({
      mockedDependencies,
      configuration: {
        authMethods: {
          credentials: true,
          googleOAuth: false,
        },
        refreshTokens: { enabled: false },
      },
    });
    const result = await service.loginWithEmail({
      email: "test@odysseon.com",
      password: "correct_password",
    });

    assert.equal(result.accessToken, "signed_access_token");
    assert.equal(result.refreshToken, undefined);
    assert.equal(
      mockedDependencies.refreshTokenRepository.store.mock.callCount(),
      0,
    );
  });

  it("should reject email login when credentials authentication is disabled", async () => {
    const { service } = createService({
      configuration: {
        authMethods: { credentials: false, googleOAuth: false },
        refreshTokens: { enabled: false },
      },
    });

    await assert.rejects(
      () =>
        service.loginWithEmail({
          email: "test@odysseon.com",
          password: "password",
        }),
      /Credentials authentication is disabled/,
    );
  });

  it("should reject email login with empty password", async () => {
    const { service } = createService();

    await assert.rejects(
      () =>
        service.loginWithEmail({
          email: "test@odysseon.com",
          password: "",
        }),
      /Invalid email or password/,
    );
  });

  it("should reject email login when user does not exist", async () => {
    const { service } = createService();

    await assert.rejects(
      () =>
        service.loginWithEmail({
          email: "ghost@odysseon.com",
          password: "password",
        }),
      /Invalid email or password/,
    );
  });

  it("should reject email login when password verification fails", async () => {
    const mockedDependencies = createMockedDependencies();
    mockedDependencies.userRepository.findByEmail.mock.mockImplementation(
      async () => ({
        id: "user_123",
        email: "test@odysseon.com",
        passwordHash: "stored_hash",
      }),
    );
    mockedDependencies.passwordHasher.verify.mock.mockImplementation(
      async () => false,
    );

    const { service } = createService({ mockedDependencies });

    await assert.rejects(
      () =>
        service.loginWithEmail({
          email: "test@odysseon.com",
          password: "wrong_password",
        }),
      /Invalid email or password/,
    );
  });

  it("should log in with Google OAuth", async () => {
    const { service, mockedDependencies } = createService({
      configuration: {
        authMethods: { credentials: false, googleOAuth: true },
        refreshTokens: { enabled: true },
      },
    });

    const result = await service.loginWithGoogle({
      idToken: "google-id-token",
    });

    assert.equal(result.accessToken, "signed_access_token");
    assert.ok(typeof result.refreshToken === "string");
    assert.equal(
      mockedDependencies.googleIdTokenVerifier.verify.mock.callCount(),
      1,
    );
    assert.equal(
      mockedDependencies.googleUserRepository.resolveGoogleUser.mock.callCount(),
      1,
    );
  });

  it("should reject Google login when Google auth is disabled", async () => {
    const { service } = createService({
      configuration: {
        authMethods: { credentials: false, googleOAuth: false },
        refreshTokens: { enabled: false },
      },
    });

    await assert.rejects(
      () =>
        service.loginWithGoogle({
          idToken: "google-id-token",
        }),
      /Google OAuth authentication is disabled/,
    );
  });

  it("should reject Google login with empty ID token", async () => {
    const { service } = createService();

    await assert.rejects(
      () =>
        service.loginWithGoogle({
          idToken: " ",
        }),
      /Google ID token is required/,
    );
  });

  it("should reject token refresh when refresh tokens are disabled", async () => {
    const { service } = createService({
      configuration: {
        authMethods: {
          credentials: false,
          googleOAuth: false,
        },
        refreshTokens: { enabled: false },
      },
    });

    await assert.rejects(
      () => service.refreshTokens("refresh-token"),
      /Refresh tokens are disabled/,
    );
  });

  it("should reject token refresh when token input is empty", async () => {
    const { service } = createService();

    await assert.rejects(
      () => service.refreshTokens(" "),
      /Invalid or expired refresh token/,
    );
  });

  it("should reject token refresh when token does not exist", async () => {
    const { service } = createService();

    await assert.rejects(
      () => service.refreshTokens("refresh-token"),
      /Invalid or expired refresh token/,
    );
  });

  it("should revoke sessions when a revoked refresh token is reused", async () => {
    const mockedDependencies = createMockedDependencies();
    mockedDependencies.refreshTokenRepository.findByHash.mock.mockImplementation(
      async () => ({
        id: "rt_1",
        userId: "user_123",
        tokenHash: "hash:refresh-token",
        expiresAt: new Date(Date.now() + 60_000),
        isRevoked: true,
      }),
    );

    const { service } = createService({ mockedDependencies });

    await assert.rejects(
      () => service.refreshTokens("refresh-token"),
      (error: unknown) => {
        assert.ok(error instanceof WhoamiError);
        assert.equal(error.code, "TOKEN_REUSED");
        return true;
      },
    );

    assert.equal(
      mockedDependencies.refreshTokenRepository.revokeAllForUser.mock.callCount(),
      1,
    );
  });

  it("should reject expired refresh tokens", async () => {
    const mockedDependencies = createMockedDependencies();
    mockedDependencies.refreshTokenRepository.findByHash.mock.mockImplementation(
      async () => ({
        id: "rt_1",
        userId: "user_123",
        tokenHash: "hash:refresh-token",
        expiresAt: new Date(Date.now() - 60_000),
        isRevoked: false,
      }),
    );

    const { service } = createService({ mockedDependencies });

    await assert.rejects(
      () => service.refreshTokens("refresh-token"),
      /Refresh token has expired/,
    );
  });

  it("should reject refresh when the user cannot be found in any enabled repository", async () => {
    const mockedDependencies = createMockedDependencies();
    mockedDependencies.refreshTokenRepository.findByHash.mock.mockImplementation(
      async () => ({
        id: "rt_1",
        userId: "missing_user",
        tokenHash: "hash:refresh-token",
        expiresAt: new Date(Date.now() + 60_000),
        isRevoked: false,
      }),
    );
    mockedDependencies.userRepository.findById.mock.mockImplementation(
      async () => null,
    );
    mockedDependencies.googleUserRepository.findById.mock.mockImplementation(
      async () => null,
    );

    const { service } = createService({ mockedDependencies });

    await assert.rejects(
      () => service.refreshTokens("refresh-token"),
      /User no longer exists/,
    );
  });

  it("should revoke sessions when rotation fails", async () => {
    const mockedDependencies = createMockedDependencies();
    mockedDependencies.refreshTokenRepository.findByHash.mock.mockImplementation(
      async () => ({
        id: "rt_1",
        userId: "user_123",
        tokenHash: "hash:refresh-token",
        expiresAt: new Date(Date.now() + 60_000),
        isRevoked: false,
      }),
    );
    mockedDependencies.refreshTokenRepository.rotate.mock.mockImplementation(
      async () => false,
    );

    const { service } = createService({ mockedDependencies });

    await assert.rejects(
      () => service.refreshTokens("refresh-token"),
      (error: unknown) => {
        assert.ok(error instanceof WhoamiError);
        assert.equal(error.code, "TOKEN_REUSED");
        return true;
      },
    );

    assert.equal(
      mockedDependencies.refreshTokenRepository.revokeAllForUser.mock.callCount(),
      1,
    );
  });

  it("should rotate refresh tokens successfully", async () => {
    const mockedDependencies = createMockedDependencies();
    mockedDependencies.refreshTokenRepository.findByHash.mock.mockImplementation(
      async () => ({
        id: "rt_1",
        userId: "user_123",
        tokenHash: "hash:refresh-token",
        expiresAt: new Date(Date.now() + 60_000),
        isRevoked: false,
      }),
    );

    const { service } = createService({ mockedDependencies });
    const result = await service.refreshTokens("refresh-token");

    assert.equal(result.accessToken, "signed_access_token");
    assert.ok(typeof result.refreshToken === "string");
    assert.equal(
      mockedDependencies.refreshTokenRepository.rotate.mock.callCount(),
      1,
    );
  });

  it("should refresh using the Google user repository when credentials auth is unavailable", async () => {
    const mockedDependencies = createMockedDependencies();
    mockedDependencies.refreshTokenRepository.findByHash.mock.mockImplementation(
      async () => ({
        id: "rt_1",
        userId: "google_user_123",
        tokenHash: "hash:refresh-token",
        expiresAt: new Date(Date.now() + 60_000),
        isRevoked: false,
      }),
    );
    mockedDependencies.googleUserRepository.findById.mock.mockImplementation(
      async (id: string) => ({ id }),
    );

    const { service } = createService({
      mockedDependencies,
      configuration: {
        authMethods: {
          credentials: false,
          googleOAuth: true,
        },
        refreshTokens: {
          enabled: true,
        },
      },
      omit: {
        userRepository: true,
        passwordHasher: true,
      },
    });

    const result = await service.refreshTokens("refresh-token");
    assert.equal(result.accessToken, "signed_access_token");
  });

  it("should verify access tokens through the configured signer", async () => {
    const mockedDependencies = createMockedDependencies();
    mockedDependencies.tokenSigner.verify.mock.mockImplementation(async () => ({
      sub: "verified_user",
      iss: "whoami-tests",
    }));

    const { service } = createService({ mockedDependencies });
    const payload = await service.verifyAccessToken("access-token");

    assert.deepEqual(payload, {
      sub: "verified_user",
      iss: "whoami-tests",
    });
    assert.equal(mockedDependencies.tokenSigner.verify.mock.callCount(), 1);
  });
});
