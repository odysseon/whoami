import { describe, it, after } from "node:test";
import { strict as assert } from "node:assert";
import type { ExecutionContext } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { WhoamiService } from "@odysseon/whoami-core";
import type {
  IEmailUserRepository,
  IRefreshTokenRepository,
  IUserWithPassword,
} from "@odysseon/whoami-core";
import { WhoamiAuthGuard } from "../dist/whoami-auth.guard.js";
import type { WhoamiRequestIdentity } from "./whoami-auth.types.js";
import { WhoamiController } from "../dist/whoami.controller.js";
import { WhoamiModule } from "../dist/whoami.module.js";

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
    return this.tokens.find((t) => t.tokenHash === tokenHash) ?? null;
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
    const idx = this.tokens.findIndex((t) => t.tokenHash === oldTokenHash);
    if (idx === -1) return false;
    this.tokens[idx] = { id: this.tokens[idx].id, ...newData };
    return true;
  }

  async revokeAllForUser(userId: string): Promise<void> {
    this.tokens = this.tokens.map((t) =>
      t.userId === userId ? { ...t, isRevoked: true } : t,
    );
  }
}

let moduleRef: TestingModule | undefined;

describe("WhoamiModule (Nest adapter)", () => {
  after(async () => {
    if (moduleRef && typeof moduleRef.close === "function") {
      await moduleRef.close();
    }
  });

  it("should boot with defaults and provide WhoamiService", async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        WhoamiModule.register({
          userRepository: InMemoryUserRepository,
          refreshTokenRepository: InMemoryRefreshTokenRepository,
          tokenSignerOptions: {
            secret: "super_secret_key_that_is_at_least_32_chars_long!!",
            issuer: "whoami-tests",
            audience: "whoami-users",
          },
        }),
      ],
    }).compile();

    const whoamiService = moduleRef.get(WhoamiService);
    assert.ok(whoamiService);

    const user = await whoamiService.registerWithEmail({
      email: "test@example.com",
      password: "password123",
    });

    assert.equal(user.email, "test@example.com");
    assert.ok(user.id);

    const authTokens = await whoamiService.loginWithEmail({
      email: "test@example.com",
      password: "password123",
    });

    assert.ok(typeof authTokens.accessToken === "string");
    assert.ok(typeof authTokens.refreshToken === "string");

    const payload = await whoamiService.verifyAccessToken(
      authTokens.accessToken,
    );
    assert.equal(payload.sub, user.id);
    assert.equal(payload.iss, "whoami-tests");
    assert.equal(payload.aud, "whoami-users");
  });

  it("should expose the default controller and resolve identity through the guard", async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        WhoamiModule.register({
          userRepository: InMemoryUserRepository,
          refreshTokenRepository: InMemoryRefreshTokenRepository,
          tokenSignerOptions: {
            secret: "super_secret_key_that_is_at_least_32_chars_long!!",
            issuer: "whoami-tests",
            audience: "whoami-users",
          },
        }),
      ],
    }).compile();

    const controller = moduleRef.get(WhoamiController);
    const guard = moduleRef.get(WhoamiAuthGuard);

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

    const context: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => undefined,
        getNext: () => undefined,
      }),
      switchToRpc: () => {
        throw new Error("Not implemented in test");
      },
      switchToWs: () => {
        throw new Error("Not implemented in test");
      },
      getClass: () => WhoamiController,
      getHandler: () => controller.me,
      getArgs: () => [],
      getArgByIndex: () => undefined,
      getType: () => "http",
    };

    const activated = await guard.canActivate(context);
    const identity = request.user as WhoamiRequestIdentity;

    assert.equal(activated, true);
    assert.equal(identity.sub, user.id);
    assert.equal(identity.iss, "whoami-tests");
    assert.equal(identity.aud, "whoami-users");
    assert.ok(typeof identity.exp === "number");
    assert.ok(typeof identity.iat === "number");

    assert.deepEqual(controller.me(identity), identity);
  });
});
