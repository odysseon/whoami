import { describe, it, mock } from "node:test";
import { strict as assert } from "node:assert";
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { WhoamiError, type ITokenExtractor } from "@odysseon/whoami-core";
import { BearerTokenExtractor } from "./default-token-extractor.js";
import { NestLoggerAdapter } from "./nest-logger.adapter.js";
import { WhoamiAuthGuard } from "./whoami-auth.guard.js";
import { WhoamiController } from "./whoami.controller.js";
import { WhoamiIdentity } from "./whoami.decorator.js";
import { mapWhoamiError } from "./whoami-error.mapper.js";
import { WhoamiModule } from "./whoami.module.js";
import {
  WHOAMI_CONFIGURATION,
  WHOAMI_GOOGLE_ID_TOKEN_VERIFIER,
  WHOAMI_GOOGLE_USER_REPOSITORY,
  WHOAMI_LOGGER,
  WHOAMI_PASSWORD_HASHER,
  WHOAMI_REFRESH_TOKEN_REPOSITORY,
  WHOAMI_TOKEN_EXTRACTOR,
  WHOAMI_TOKEN_HASHER,
  WHOAMI_TOKEN_SIGNER,
  WHOAMI_USER_REPOSITORY,
} from "./constants.js";

describe("Nest adapter helpers", () => {
  it("should extract bearer tokens from string and array authorization headers", () => {
    const extractor = new BearerTokenExtractor();

    assert.equal(
      extractor.extract({
        headers: {
          authorization: "Bearer access-token",
        },
      }),
      "access-token",
    );
    assert.equal(
      extractor.extract({
        headers: {
          Authorization: ["Bearer array-token"],
        },
      }),
      "array-token",
    );
  });

  it("should reject invalid token extraction inputs", () => {
    const extractor = new BearerTokenExtractor();

    assert.equal(extractor.extract(null), null);
    assert.equal(extractor.extract({ headers: {} }), null);
    assert.equal(
      extractor.extract({
        headers: {
          authorization: "Basic abc123",
        },
      }),
      null,
    );
    assert.equal(
      extractor.extract({
        headers: {
          authorization: "Bearer ",
        },
      }),
      null,
    );
  });

  it("should map Whoami errors to Nest HTTP exceptions", () => {
    assert.ok(
      mapWhoamiError(
        new WhoamiError("USER_ALREADY_EXISTS", "User already exists."),
      ) instanceof ConflictException,
    );
    assert.ok(
      mapWhoamiError(
        new WhoamiError("AUTH_METHOD_DISABLED", "Auth method disabled."),
      ) instanceof BadRequestException,
    );
    assert.ok(
      mapWhoamiError(
        new WhoamiError("INVALID_CONFIGURATION", "Configuration is invalid."),
      ) instanceof BadRequestException,
    );
    assert.ok(
      mapWhoamiError(
        new WhoamiError("TOKEN_REUSED", "Token reused."),
      ) instanceof UnauthorizedException,
    );
    assert.ok(
      mapWhoamiError(
        new WhoamiError("USER_NOT_FOUND", "User not found."),
      ) instanceof BadRequestException,
    );
    assert.ok(
      mapWhoamiError(
        new WhoamiError(
          "UNSUPPORTED_AUTH_METHOD",
          "Unsupported authentication method.",
        ),
      ) instanceof UnauthorizedException,
    );
  });

  it("should expose a parameter decorator for identity access", () => {
    const decorator = WhoamiIdentity();

    assert.equal(typeof decorator, "function");
  });

  it("should delegate logger calls to Nest Logger methods", () => {
    const adapter = new NestLoggerAdapter("WhoamiTests");
    const logSpy = mock.fn();
    const warnSpy = mock.fn();
    const errorSpy = mock.fn();
    const debugSpy = mock.fn();

    adapter.log = logSpy as typeof adapter.log;
    adapter.warn = warnSpy as typeof adapter.warn;
    adapter.error = errorSpy as typeof adapter.error;
    adapter.debug = debugSpy as typeof adapter.debug;

    adapter.info("info message", { a: 1 });
    adapter.warn("warn message", { b: 2 });
    adapter.error("error message", { c: 3 });
    adapter.debug("debug message", { d: 4 });

    assert.equal(logSpy.mock.callCount(), 1);
    assert.equal(warnSpy.mock.callCount(), 1);
    assert.equal(errorSpy.mock.callCount(), 1);
    assert.equal(debugSpy.mock.callCount(), 1);
  });

  it("should enforce missing-token and invalid-token guard branches", async () => {
    const extractor: ITokenExtractor = {
      extract: (): null => null,
    };
    const whoamiService = {
      verifyAccessToken: async (): Promise<{ sub: string }> => ({
        sub: "user_123",
      }),
    };
    const guard = new WhoamiAuthGuard(whoamiService as never, extractor);

    const context = {
      switchToHttp: (): { getRequest: () => Record<string, never> } => ({
        getRequest: (): Record<string, never> => ({}),
      }),
    } as ExecutionContext;

    await assert.rejects(
      () => guard.canActivate(context),
      UnauthorizedException,
    );

    const failingGuard = new WhoamiAuthGuard(
      {
        verifyAccessToken: async (): Promise<never> => {
          throw new WhoamiError("TOKEN_EXPIRED", "Token expired.");
        },
      } as never,
      {
        extract: (): string => "access-token",
      },
    );

    await assert.rejects(
      () => failingGuard.canActivate(context),
      UnauthorizedException,
    );
  });

  it("should map controller errors for all built-in routes", async () => {
    const controller = new WhoamiController({
      registerWithEmail: async () => {
        throw new WhoamiError("USER_ALREADY_EXISTS", "User already exists.");
      },
      loginWithEmail: async () => {
        throw new WhoamiError(
          "AUTH_METHOD_DISABLED",
          "Credentials authentication is disabled.",
        );
      },
      refreshTokens: async () => {
        throw new WhoamiError("TOKEN_EXPIRED", "Refresh token expired.");
      },
      loginWithGoogle: async () => {
        throw new WhoamiError(
          "INVALID_CREDENTIALS",
          "Google ID token is required.",
        );
      },
      getAuthStatus: () => ({
        authMethods: {
          credentials: false,
          googleOAuth: true,
        },
        refreshTokens: false,
        accessTokenTtlSeconds: 900,
        refreshTokenTtlSeconds: null,
      }),
    } as never);

    await assert.rejects(
      () =>
        controller.register({
          email: "test@example.com",
          password: "password123",
        }),
      ConflictException,
    );
    await assert.rejects(
      () =>
        controller.login({
          email: "test@example.com",
          password: "password123",
        }),
      BadRequestException,
    );
    await assert.rejects(
      () =>
        controller.refresh({
          refreshToken: "refresh-token",
        }),
      UnauthorizedException,
    );
    await assert.rejects(
      () =>
        controller.google({
          idToken: "google-id-token",
        }),
      UnauthorizedException,
    );
    assert.deepEqual(controller.status(), {
      authMethods: {
        credentials: false,
        googleOAuth: true,
      },
      refreshTokens: false,
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: null,
    });
  });

  it("should build dynamic modules for sync and async provider variants", () => {
    class TokenSigner {
      async sign(): Promise<string> {
        return "signed";
      }

      async verify(): Promise<{ sub: string }> {
        return { sub: "user_123" };
      }
    }

    const syncModule = WhoamiModule.register({
      configuration: {
        authMethods: {
          credentials: false,
          googleOAuth: false,
        },
        refreshTokens: {
          enabled: false,
        },
      },
      controller: false,
      tokenSigner: TokenSigner,
    });

    assert.deepEqual(syncModule.controllers, []);
    assert.ok((syncModule.exports as unknown[]).includes(WHOAMI_CONFIGURATION));

    const syncProviders = syncModule.providers as Array<
      Record<string, unknown>
    >;
    assert.ok(
      syncProviders.every(
        (provider) => provider.provide !== WHOAMI_USER_REPOSITORY,
      ),
    );
    assert.ok(
      syncProviders.every(
        (provider) => provider.provide !== WHOAMI_GOOGLE_USER_REPOSITORY,
      ),
    );
    assert.ok(
      syncProviders.every(
        (provider) => provider.provide !== WHOAMI_REFRESH_TOKEN_REPOSITORY,
      ),
    );
    assert.ok(
      syncProviders.every(
        (provider) => provider.provide !== WHOAMI_PASSWORD_HASHER,
      ),
    );
    assert.ok(
      syncProviders.every(
        (provider) => provider.provide !== WHOAMI_TOKEN_HASHER,
      ),
    );
    assert.ok(
      syncProviders.every(
        (provider) => provider.provide !== WHOAMI_GOOGLE_ID_TOKEN_VERIFIER,
      ),
    );

    const asyncModule = WhoamiModule.registerAsync({
      userRepository: {
        useExisting: "USER_REPOSITORY",
      },
      googleUserRepository: {
        useClass: class GoogleUserRepository {},
      },
      refreshTokenRepository: {
        useFactory: async (): Promise<{
          store: () => Promise<void>;
          findByHash: () => Promise<null>;
          rotate: () => Promise<boolean>;
          revokeAllForUser: () => Promise<void>;
        }> => ({
          store: async (): Promise<void> => {},
          findByHash: async (): Promise<null> => null,
          rotate: async (): Promise<boolean> => false,
          revokeAllForUser: async (): Promise<void> => {},
        }),
      },
      passwordHasher: {
        useValue: {
          hash: async (): Promise<string> => "hash",
          verify: async (): Promise<boolean> => true,
        },
      },
      tokenHasher: {
        useExisting: "TOKEN_HASHER",
      },
      tokenSigner: {
        useFactory: async (): Promise<TokenSigner> => new TokenSigner(),
      },
      googleIdTokenVerifier: {
        useFactory: async (): Promise<{
          verify: () => Promise<{ sub: string }>;
        }> => ({
          verify: async (): Promise<{ sub: string }> => ({
            sub: "google-sub",
          }),
        }),
      },
      tokenExtractor: {
        useExisting: "TOKEN_EXTRACTOR",
      },
      logger: {
        useClass: NestLoggerAdapter,
      },
      configuration: {
        useValue: {
          authMethods: {
            credentials: true,
            googleOAuth: true,
          },
          refreshTokens: {
            enabled: true,
          },
        },
      },
    });

    const asyncProviders = asyncModule.providers as Array<
      Record<string, unknown>
    >;
    assert.ok(
      asyncProviders.some(
        (provider) =>
          provider.provide === WHOAMI_USER_REPOSITORY &&
          provider.useExisting === "USER_REPOSITORY",
      ),
    );
    assert.ok(
      asyncProviders.some(
        (provider) =>
          provider.provide === WHOAMI_GOOGLE_USER_REPOSITORY &&
          provider.useClass,
      ),
    );
    assert.ok(
      asyncProviders.some(
        (provider) =>
          provider.provide === WHOAMI_REFRESH_TOKEN_REPOSITORY &&
          provider.useFactory,
      ),
    );
    assert.ok(
      asyncProviders.some(
        (provider) =>
          provider.provide === WHOAMI_PASSWORD_HASHER && provider.useValue,
      ),
    );
    assert.ok(
      asyncProviders.some(
        (provider) =>
          provider.provide === WHOAMI_TOKEN_HASHER &&
          provider.useExisting === "TOKEN_HASHER",
      ),
    );
    assert.ok(
      asyncProviders.some(
        (provider) =>
          provider.provide === WHOAMI_TOKEN_SIGNER && provider.useFactory,
      ),
    );
    assert.ok(
      asyncProviders.some(
        (provider) =>
          provider.provide === WHOAMI_GOOGLE_ID_TOKEN_VERIFIER &&
          provider.useFactory,
      ),
    );
    assert.ok(
      asyncProviders.some(
        (provider) =>
          provider.provide === WHOAMI_TOKEN_EXTRACTOR &&
          provider.useExisting === "TOKEN_EXTRACTOR",
      ),
    );
    assert.ok(
      asyncProviders.some(
        (provider) =>
          provider.provide === WHOAMI_LOGGER &&
          provider.useClass === NestLoggerAdapter,
      ),
    );
    assert.ok(
      asyncProviders.some(
        (provider) =>
          provider.provide === WHOAMI_CONFIGURATION && provider.useValue,
      ),
    );
    assert.ok(
      (asyncModule.exports as unknown[]).includes(WHOAMI_CONFIGURATION),
    );
  });
});
