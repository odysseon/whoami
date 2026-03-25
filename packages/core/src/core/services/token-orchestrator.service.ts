import { WhoamiError } from "../../errors/whoami-error.js";
import type { IAuthTokens } from "../../interfaces/operation-contracts/auth-tokens.interface.js";
import type { IJwtPayload } from "../../interfaces/models/jwt-payload.interface.js";
import type { IWhoamiAuthStatus } from "../../interfaces/operation-contracts/auth-status.interface.js";
import type { WhoamiServiceDependencies } from "../whoami.service.js";
import type { IUser } from "../../interfaces/models/user.interface.js";
import { IDeterministicTokenHasher } from "../../interfaces/ports/security/deterministic-token-hasher.port.js";
import { IRefreshTokenRepository } from "../../interfaces/ports/repositories/refresh-token-repository.port.js";

export class TokenOrchestrator {
  constructor(
    private readonly deps: WhoamiServiceDependencies,
    private readonly status: IWhoamiAuthStatus,
  ) {}

  public async issueTokens(userId: string): Promise<IAuthTokens> {
    const accessToken = await this.deps.tokenSigner.sign(
      { sub: userId },
      this.status.accessTokenTtlSeconds,
    );

    if (!this.status.refreshTokens) {
      return { accessToken };
    }

    const rawRefreshToken = crypto.randomUUID();
    const tokenHasher = this.getDeps().tokenHasher;
    const repo = this.getDeps().refreshTokenRepository;

    const hashedRefreshToken = await tokenHasher.hash(rawRefreshToken);
    const expiresAt = new Date(
      Date.now() + this.status.refreshTokenTtlSeconds! * 1000,
    );

    await repo.store({
      userId,
      tokenHash: hashedRefreshToken,
      expiresAt,
      isRevoked: false,
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  public async refreshTokens(
    rawToken: string,
    findUserById: (id: string) => Promise<IUser | null>,
  ): Promise<IAuthTokens> {
    if (!this.status.refreshTokens)
      throw new WhoamiError("AUTH_METHOD_DISABLED", "Refresh tokens disabled.");
    if (!rawToken?.trim())
      throw new WhoamiError("INVALID_CREDENTIALS", "Invalid token.");

    const { tokenHasher, refreshTokenRepository: repo } = this.getDeps();
    const oldHash = await tokenHasher.hash(rawToken);
    const record = await repo.findByHash(oldHash);

    if (!record) throw new WhoamiError("INVALID_CREDENTIALS", "Invalid token.");
    if (record.isRevoked) {
      await repo.revokeAllForUser(record.userId);
      throw new WhoamiError("TOKEN_REUSED", "Token revoked.");
    }
    if (record.expiresAt < new Date())
      throw new WhoamiError("TOKEN_EXPIRED", "Token expired.");

    const user = await findUserById(record.userId);
    if (!user) throw new WhoamiError("USER_NOT_FOUND", "User missing.");

    const accessToken = await this.deps.tokenSigner.sign(
      { sub: user.id },
      this.status.accessTokenTtlSeconds,
    );
    const newRaw = crypto.randomUUID();
    const newHash = await tokenHasher.hash(newRaw);
    const expiresAt = new Date(
      Date.now() + this.status.refreshTokenTtlSeconds! * 1000,
    );

    const rotated = await repo.rotate(oldHash, {
      userId: user.id,
      tokenHash: newHash,
      expiresAt,
      isRevoked: false,
    });

    if (!rotated) {
      await repo.revokeAllForUser(user.id);
      throw new WhoamiError("TOKEN_REUSED", "Reuse detected.");
    }

    return { accessToken, refreshToken: newRaw };
  }

  public async verifyAccessToken(token: string): Promise<IJwtPayload> {
    return await this.deps.tokenSigner.verify(token);
  }

  private getDeps(): {
    tokenHasher: IDeterministicTokenHasher;
    refreshTokenRepository: IRefreshTokenRepository;
  } {
    if (!this.deps.tokenHasher || !this.deps.refreshTokenRepository) {
      throw new WhoamiError(
        "INVALID_CONFIGURATION",
        "Missing refresh token dependencies.",
      );
    }
    return {
      tokenHasher: this.deps.tokenHasher,
      refreshTokenRepository: this.deps.refreshTokenRepository,
    };
  }
}
