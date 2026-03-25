import { WhoamiError } from "../../errors/whoami-error.js";
import type { IOAuthCredentials } from "../../interfaces/operation-contracts/credentials.interface.js";
import type { IAuthTokens } from "../../interfaces/operation-contracts/auth-tokens.interface.js";
import type { IWhoamiAuthStatus } from "../../interfaces/operation-contracts/auth-status.interface.js";
import type { WhoamiServiceDependencies } from "../whoami.service.js";
import type { TokenOrchestrator } from "./token-orchestrator.service.js";
import { IOAuthUserRepository } from "../../interfaces/ports/repositories/user-repository.port.js";

export class OAuthAuthenticator {
  constructor(
    private readonly deps: WhoamiServiceDependencies,
    private readonly status: IWhoamiAuthStatus,
    private readonly tokens: TokenOrchestrator,
  ) {}

  public async login(data: IOAuthCredentials): Promise<IAuthTokens> {
    this.ensureEnabled();
    this.validateData(data);

    const repo = this.getRepo();
    let user = await repo.findByProviderId(data.provider, data.providerId);

    if (!user) {
      user = await repo.createWithProvider(data);
      this.deps.logger.info("Registered via OAuth", {
        userId: user.id,
        provider: data.provider,
      });
    }

    this.deps.logger.info("Logged in via OAuth", {
      userId: user.id,
      provider: data.provider,
    });
    return await this.tokens.issueTokens(user.id);
  }

  public async linkProvider(
    userId: string,
    data: IOAuthCredentials,
  ): Promise<void> {
    this.ensureEnabled();
    this.validateData(data);

    const repo = this.getRepo();
    const existingLink = await repo.findByProviderId(
      data.provider,
      data.providerId,
    );

    if (existingLink && existingLink.id !== userId) {
      throw new WhoamiError(
        "USER_ALREADY_EXISTS",
        "Provider linked to another user.",
      );
    }

    await repo.linkProvider({
      userId,
      provider: data.provider,
      providerId: data.providerId,
    });
    this.deps.logger.info("OAuth provider linked", {
      userId,
      provider: data.provider,
    });
  }

  private validateData(data: IOAuthCredentials): void {
    if (!data.provider || !data.providerId) {
      throw new WhoamiError(
        "INVALID_CREDENTIALS",
        "Provider and Provider ID required.",
      );
    }
  }

  private ensureEnabled(): void {
    if (!this.status.authMethods.oauth)
      throw new WhoamiError("AUTH_METHOD_DISABLED", "OAuth disabled.");
  }

  private getRepo(): IOAuthUserRepository {
    if (!this.deps.oauthUserRepository)
      throw new WhoamiError(
        "INVALID_CONFIGURATION",
        "Missing OAuth dependencies.",
      );
    return this.deps.oauthUserRepository;
  }
}
