import { WhoamiError } from "../../errors/whoami-error.js";
import type { IOAuthCredentials } from "../../interfaces/operation-contracts/credentials.interface.js";
import type { IAuthTokens } from "../../interfaces/operation-contracts/auth-tokens.interface.js";
import type { IWhoamiAuthStatus } from "../../interfaces/operation-contracts/auth-status.interface.js";
import type { TokenOrchestrator } from "./token-orchestrator.service.js";
import type { IOAuthUserRepository } from "../../interfaces/ports/repositories/user-repository.port.js";
import type { WhoamiServiceDependencies } from "../../interfaces/operation-contracts/auth-configuration.interface.js";
import type { HasId } from "../../interfaces/models/user.interface.js";

/**
 * Handles OAuth authentication operations for users.
 * Provides methods for login and provider linking using OAuth credentials.
 *
 * @typeParam TEntity - The user entity type that must satisfy the `HasId` constraint
 */
export class OAuthAuthenticator<TEntity extends HasId> {
  /**
   * Creates an instance of OAuthAuthenticator.
   *
   * @param deps - Service dependencies including repository and logger
   * @param status - Authentication status configuration
   * @param tokens - Token orchestration service for issuing auth tokens
   */
  constructor(
    private readonly deps: WhoamiServiceDependencies<TEntity>,
    private readonly status: IWhoamiAuthStatus,
    private readonly tokens: TokenOrchestrator<TEntity>,
  ) {}

  /**
   * Authenticates a user using OAuth credentials.
   * If the user doesn't exist, a new account is created automatically.
   *
   * @param data - OAuth credentials containing provider information
   * @returns A promise that resolves to the issued authentication tokens
   * @throws {WhoamiError} When OAuth is disabled or credentials are invalid
   */
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

  /**
   * Links an OAuth provider to an existing user account.
   *
   * @param userId - The ID of the user to link the provider to
   * @param data - OAuth credentials containing provider information
   * @returns A promise that resolves when the provider is linked
   * @throws {WhoamiError} When OAuth is disabled, credentials are invalid,
   *         or the provider is already linked to another user
   */
  public async linkProvider(
    userId: TEntity["id"],
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

  /**
   * Validates OAuth credentials for required fields.
   *
   * @param data - The OAuth credentials to validate
   * @throws {WhoamiError} When provider or providerId is missing
   * @private
   */
  private validateData(data: IOAuthCredentials): void {
    if (!data.provider || !data.providerId) {
      throw new WhoamiError(
        "INVALID_CREDENTIALS",
        "Provider and Provider ID required.",
      );
    }
  }

  /**
   * Ensures OAuth authentication is enabled in the configuration.
   *
   * @throws {WhoamiError} When OAuth is disabled
   * @private
   */
  private ensureEnabled(): void {
    if (!this.status.authMethods?.oauth)
      throw new WhoamiError("AUTH_METHOD_DISABLED", "OAuth disabled.");
  }

  /**
   * Retrieves the OAuth user repository from dependencies.
   *
   * @returns The OAuth user repository instance
   * @throws {WhoamiError} When OAuth dependencies are missing
   * @private
   */
  private getRepo(): IOAuthUserRepository<TEntity> {
    if (!this.deps.oauthUserRepository)
      throw new WhoamiError(
        "INVALID_CONFIGURATION",
        "Missing OAuth dependencies.",
      );
    return this.deps.oauthUserRepository;
  }
}
