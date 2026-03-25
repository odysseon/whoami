import { describe, it, after } from "node:test";
import { strict as assert } from "node:assert";
import { Test, TestingModule } from "@nestjs/testing";
import { WhoamiModule } from "./whoami.module.js";
import { WhoamiService } from "@odysseon/whoami-core";
import type {
  IEmailUserRepository,
  IRefreshTokenRepository,
  IUserWithPassword,
} from "@odysseon/whoami-core";

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
});
