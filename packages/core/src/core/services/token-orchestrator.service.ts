import { WhoamiError } from "../../errors/whoami-error.js";
import type { IAuthTokens } from "../../interfaces/operation-contracts/auth-tokens.interface.js";
import type { IJwtPayload } from "../../interfaces/models/jwt-payload.interface.js";
import type { IWhoamiAuthStatus } from "../../interfaces/operation-contracts/auth-status.interface.js";
import type { IDeterministicTokenHasher } from "../../interfaces/ports/security/deterministic-token-hasher.port.js";
import type { IRefreshTokenRepository } from "../../interfaces/ports/repositories/refresh-token-repository.port.js";
import type { WhoamiServiceDependencies } from "../../interfaces/operation-contracts/auth-configuration.interface.js";
import type { ITokenGenerator } from "../../interfaces/ports/security/token-generator.port.js";
import type { HasId } from "../../interfaces/models/user.interface.js";

export class TokenOrchestrator<TEntity extends HasId> {
  constructor(
    private readonly deps: WhoamiServiceDependencies<TEntity>,
    private readonly status: IWhoamiAuthStatus,
  ) {}

  public async issueTokens(userId: TEntity["id"]): Promise<IAuthTokens> {
    const accessToken = await this.deps.tokenSigner.sign(
      { sub: userId },
      this.status.accessTokenTtlSeconds,
    );

    if (!this.status.refreshTokens) {
      return { accessToken };
    }

    // FIX: Using strictly injected dependencies instead of global state
    const {
      tokenGenerator,
      tokenHasher,
      refreshTokenRepository: repo,
    } = this.getDeps();

    const rawRefreshToken = tokenGenerator.generate();
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
    findUserById: (id: TEntity["id"]) => Promise<TEntity | null>,
  ): Promise<IAuthTokens> {
    if (!this.status.refreshTokens)
      throw new WhoamiError("AUTH_METHOD_DISABLED", "Refresh tokens disabled.");
    if (!rawToken?.trim())
      throw new WhoamiError("INVALID_CREDENTIALS", "Invalid token.");

    const {
      tokenHasher,
      refreshTokenRepository: repo,
      tokenGenerator,
    } = this.getDeps();

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

    const newRaw = tokenGenerator.generate();
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
    refreshTokenRepository: IRefreshTokenRepository<TEntity["id"]>;
    tokenGenerator: ITokenGenerator;
  } {
    if (
      !this.deps.tokenHasher ||
      !this.deps.refreshTokenRepository ||
      !this.deps.tokenGenerator
    ) {
      throw new WhoamiError(
        "INVALID_CONFIGURATION",
        "Missing refresh token dependencies.",
      );
    }
    return {
      tokenHasher: this.deps.tokenHasher,
      refreshTokenRepository: this.deps.refreshTokenRepository,
      tokenGenerator: this.deps.tokenGenerator,
    };
  }
}
