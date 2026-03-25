import { after, describe, it } from "node:test";
import { strict as assert } from "node:assert";
import type { ExecutionContext } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { WhoamiService } from "@odysseon/whoami-core";
import type {
  IEmailUserRepository,
  IGoogleIdentity,
  IGoogleIdTokenVerifier,
  IGoogleUserRepository,
  IRefreshTokenRepository,
  ITokenExtractor,
  IUser,
  IUserWithPassword,
} from "@odysseon/whoami-core";
import { WHOAMI_TOKEN_EXTRACTOR } from "./constants.js";
import type { WhoamiRequestIdentity } from "./whoami-auth.types.js";
import { WhoamiAuthGuard } from "./whoami-auth.guard.js";
import { WhoamiController } from "./whoami.controller.js";
import { WhoamiModule } from "./whoami.module.js";

class InMemoryUserRepository implements IEmailUserRepository {
  private users: IUserWithPassword[] = [];

  async findById(id: string): Promise<IUserWithPassword | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<IUserWithPassword | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async create(data: {
    email: string;
    passwordHash: string;
  }): Promise<IUserWithPassword> {
    const user = {
      id: `user_${Math.random().toString(36).slice(2)}`,
      email: data.email,
      passwordHash: data.passwordHash,
    };
    this.users.push(user);
    return user;
  }
}

class InMemoryGoogleUserRepository implements IGoogleUserRepository {
  private users: Array<IUser & { googleSub: string; email?: string }> = [];

  async findById(id: string): Promise<IUser | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async resolveGoogleUser(identity: IGoogleIdentity): Promise<IUser> {
    const existingUser = this.users.find(
      (user) => user.googleSub === identity.sub,
    );
    if (existingUser) {
      return existingUser;
    }

    const user = {
      id: `google_${Math.random().toString(36).slice(2)}`,
      googleSub: identity.sub,
      email: typeof identity.email === "string" ? identity.email : undefined,
    };
    this.users.push(user);
    return user;
  }
}

class StaticGoogleIdTokenVerifier implements IGoogleIdTokenVerifier {
  async verify(idToken: string): Promise<IGoogleIdentity> {
    return {
      sub: `google-sub:${idToken}`,
      email: `${idToken}@example.com`,
      emailVerified: true,
    };
  }
}

class InMemoryRefreshTokenRepository implements IRefreshTokenRepository {
  private tokens: Array<{
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    isRevoked: boolean;
  }> = [];

  async store(token: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    isRevoked: boolean;
  }): Promise<void> {
    this.tokens.push({
      id: `rt_${Math.random().toString(36).slice(2)}`,
      ...token,
    });
  }

  async findByHash(tokenHash: string): Promise<{
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    isRevoked: boolean;
  } | null> {
    return this.tokens.find((token) => token.tokenHash === tokenHash) ?? null;
  }

  async rotate(
    oldTokenHash: string,
    newData: {
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      isRevoked: boolean;
    },
  ): Promise<boolean> {
    const index = this.tokens.findIndex(
      (token) => token.tokenHash === oldTokenHash,
    );
    if (index === -1) {
      return false;
    }

    this.tokens[index] = { id: this.tokens[index].id, ...newData };
    return true;
  }

  async revokeAllForUser(userId: string): Promise<void> {
    this.tokens = this.tokens.map((token) =>
      token.userId === userId ? { ...token, isRevoked: true } : token,
    );
  }
}

let moduleRef: TestingModule | undefined;

function createHttpContext(
  controller: WhoamiController,
  request: { headers: { authorization: string }; user?: unknown },
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => undefined,
      getNext: () => undefined,
    }),
    switchToRpc: (): never => {
      throw new Error("Not implemented in test");
    },
    switchToWs: (): never => {
      throw new Error("Not implemented in test");
    },
    getClass: () => WhoamiController,
    getHandler: () => controller.me,
    getArgs: () => [],
    getArgByIndex: () => undefined,
    getType: () => "http",
  };
}

describe("WhoamiModule (Nest adapter)", () => {
  after(async () => {
    if (moduleRef && typeof moduleRef.close === "function") {
      await moduleRef.close();
    }
  });

  it("should boot with credentials auth and refresh tokens enabled", async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        WhoamiModule.register({
          userRepository: InMemoryUserRepository,
          refreshTokenRepository: InMemoryRefreshTokenRepository,
          configuration: {
            authMethods: {
              credentials: true,
              googleOAuth: false,
            },
            refreshTokens: {
              enabled: true,
            },
          },
          tokenSignerOptions: {
            secret: "super_secret_key_that_is_at_least_32_chars_long!!",
            issuer: "whoami-tests",
            audience: "whoami-users",
          },
        }),
      ],
    }).compile();

    const whoamiService = moduleRef.get(WhoamiService);
    const user = await whoamiService.registerWithEmail({
      email: "test@example.com",
      password: "password123",
    });
    const authTokens = await whoamiService.loginWithEmail({
      email: "test@example.com",
      password: "password123",
    });
    const payload = await whoamiService.verifyAccessToken(
      authTokens.accessToken,
    );

    assert.equal(user.email, "test@example.com");
    assert.ok(typeof authTokens.refreshToken === "string");
    assert.equal(payload.sub, user.id);
    assert.deepEqual(whoamiService.getAuthStatus(), {
      authMethods: {
        credentials: true,
        googleOAuth: false,
      },
      refreshTokens: true,
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: 604800,
    });
  });

  it("should expose the default controller and resolve identity through the guard", async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        WhoamiModule.register({
          userRepository: InMemoryUserRepository,
          refreshTokenRepository: InMemoryRefreshTokenRepository,
          configuration: {
            authMethods: {
              credentials: true,
              googleOAuth: false,
            },
            refreshTokens: {
              enabled: true,
            },
          },
          tokenSignerOptions: {
            secret: "super_secret_key_that_is_at_least_32_chars_long!!",
            issuer: "whoami-tests",
            audience: "whoami-users",
          },
        }),
      ],
    }).compile();

    const whoamiService = moduleRef.get(WhoamiService);
    const tokenExtractor = moduleRef.get<ITokenExtractor>(
      WHOAMI_TOKEN_EXTRACTOR,
    );
    const controller = new WhoamiController(whoamiService);
    const guard = new WhoamiAuthGuard(whoamiService, tokenExtractor);
    const user = await controller.register({
      email: "guard@example.com",
      password: "password123",
    });
    const authTokens = await controller.login({
      email: "guard@example.com",
      password: "password123",
    });
    const request: { headers: { authorization: string }; user?: unknown } = {
      headers: {
        authorization: `Bearer ${authTokens.accessToken}`,
      },
    };

    const activated = await guard.canActivate(
      createHttpContext(controller, request),
    );
    const identity = request.user as WhoamiRequestIdentity;

    assert.equal(activated, true);
    assert.equal(identity.sub, user.id);
    assert.equal(identity.iss, "whoami-tests");
    assert.equal(identity.aud, "whoami-users");
    assert.ok(typeof identity.exp === "number");
    assert.ok(typeof identity.iat === "number");
    assert.deepEqual(controller.me(identity), identity);
    assert.deepEqual(controller.status(), {
      authMethods: {
        credentials: true,
        googleOAuth: false,
      },
      refreshTokens: true,
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: 604800,
    });
  });

  it("should support Google OAuth without refresh tokens", async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        WhoamiModule.register({
          googleUserRepository: InMemoryGoogleUserRepository,
          googleIdTokenVerifier: StaticGoogleIdTokenVerifier,
          configuration: {
            authMethods: {
              credentials: false,
              googleOAuth: true,
            },
            refreshTokens: {
              enabled: false,
            },
          },
          tokenSignerOptions: {
            secret: "super_secret_key_that_is_at_least_32_chars_long!!",
          },
        }),
      ],
    }).compile();

    const controller = new WhoamiController(moduleRef.get(WhoamiService));
    const authTokens = await controller.google({
      idToken: "google-user",
    });

    assert.equal(typeof authTokens.accessToken, "string");
    assert.equal(authTokens.refreshToken, undefined);
    assert.deepEqual(controller.status(), {
      authMethods: {
        credentials: false,
        googleOAuth: true,
      },
      refreshTokens: false,
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: null,
    });

    await assert.rejects(
      () =>
        controller.login({
          email: "disabled@example.com",
          password: "password123",
        }),
      /Credentials authentication is disabled/,
    );
  });

  it("should support async registration for credentials-only auth without refresh tokens", async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        WhoamiModule.registerAsync({
          userRepository: {
            useClass: InMemoryUserRepository,
          },
          configuration: {
            useValue: {
              authMethods: {
                credentials: true,
                googleOAuth: false,
              },
              refreshTokens: {
                enabled: false,
              },
            },
          },
          tokenSignerOptions: {
            useFactory: async () => ({
              secret: "super_secret_key_that_is_at_least_32_chars_long!!",
            }),
          },
        }),
      ],
    }).compile();

    const whoamiService = moduleRef.get(WhoamiService);
    const user = await whoamiService.registerWithEmail({
      email: "async@example.com",
      password: "password123",
    });
    const authTokens = await whoamiService.loginWithEmail({
      email: "async@example.com",
      password: "password123",
    });

    assert.equal(user.email, "async@example.com");
    assert.equal(authTokens.refreshToken, undefined);
    assert.deepEqual(whoamiService.getAuthStatus(), {
      authMethods: {
        credentials: true,
        googleOAuth: false,
      },
      refreshTokens: false,
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: null,
    });
  });

  it("should fail fast when providers are supplied without explicit auth configuration", async () => {
    await assert.rejects(
      () =>
        Test.createTestingModule({
          imports: [
            WhoamiModule.register({
              userRepository: InMemoryUserRepository,
              refreshTokenRepository: InMemoryRefreshTokenRepository,
              tokenSignerOptions: {
                secret: "super_secret_key_that_is_at_least_32_chars_long!!",
              },
            }),
          ],
        }).compile(),
      /authMethods\.credentials/,
    );
  });
});
