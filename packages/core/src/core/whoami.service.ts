import type { IJwtPayload } from "../interfaces/models/jwt-payload.interface.js";
import type {
  HasId,
  UserWithEmail,
} from "../interfaces/models/user.interface.js";
import type { IAuthTokens } from "../interfaces/operation-contracts/auth-tokens.interface.js";
import type { WhoamiServiceDependencies } from "../interfaces/operation-contracts/auth-configuration.interface.js";
import type { IWhoamiAuthStatus } from "../interfaces/operation-contracts/auth-status.interface.js";
import type {
  IEmailPasswordCredentials,
  IOAuthCredentials,
} from "../interfaces/operation-contracts/credentials.interface.js";

// Import the sub-services
import { ConfigurationValidator } from "./services/configuration-validator.service.js";
import { TokenOrchestrator } from "./services/token-orchestrator.service.js";
import { CredentialAuthenticator } from "./services/credential-authenticator.service.js";
import { OAuthAuthenticator } from "./services/oauth-authenticator.service.js";

/**
 * Main authentication service that orchestrates all authentication operations.
 * Provides a unified interface for email/password and OAuth authentication flows.
 *
 * @typeParam TEntity - The user entity type that must satisfy the `HasId` constraint.
 *                      This allows the service to work with any user entity type
 *                      while maintaining type safety throughout the authentication flow.
 */
export class WhoamiService<TEntity extends HasId = HasId> {
  private readonly configValidator: ConfigurationValidator;
  private readonly tokenOrchestrator: TokenOrchestrator<TEntity>;
  private readonly credentialAuth: CredentialAuthenticator<TEntity>;
  private readonly oauthAuth: OAuthAuthenticator<TEntity>;

  /**
   * Creates an instance of WhoamiService.
   * Initializes all sub-services with the provided dependencies.
   *
   * @param deps - Service dependencies including repositories, hasher, logger, and configuration
   */
  constructor(private readonly deps: WhoamiServiceDependencies<TEntity>) {
    this.configValidator = new ConfigurationValidator(deps);
    const status = this.configValidator.status;

    this.tokenOrchestrator = new TokenOrchestrator<TEntity>(deps, status);

    this.credentialAuth = new CredentialAuthenticator<TEntity>(
      deps,
      status,
      this.tokenOrchestrator,
    );
    this.oauthAuth = new OAuthAuthenticator<TEntity>(
      deps,
      status,
      this.tokenOrchestrator,
    );
  }

  /**
   * Gets the current authentication status configuration.
   * Returns information about which authentication methods are enabled.
   *
   * @returns The authentication status object
   */
  public getAuthStatus(): IWhoamiAuthStatus {
    return this.configValidator.status;
  }

  // --- CREDENTIAL METHODS ---

  /**
   * Registers a new user using email and password credentials.
   *
   * @param data - Email and password credentials for registration
   * @returns A promise that resolves to the created user with email information
   * @throws {WhoamiError} When registration fails due to validation or existing user
   */
  public async registerWithEmail(
    data: IEmailPasswordCredentials,
  ): Promise<UserWithEmail<TEntity>> {
    return await this.credentialAuth.register(data);
  }

  /**
   * Authenticates a user using email and password credentials.
   *
   * @param credentials - Email and password credentials for login
   * @returns A promise that resolves to the issued authentication tokens
   * @throws {WhoamiError} When authentication fails due to invalid credentials
   */
  public async loginWithEmail(
    credentials: IEmailPasswordCredentials,
  ): Promise<IAuthTokens> {
    return await this.credentialAuth.login(credentials);
  }

  /**
   * Updates the password for an existing user.
   *
   * @param userId - The ID of the user whose password is being updated
   * @param newPassword - The new password to set
   * @returns A promise that resolves when the password is updated
   * @throws {WhoamiError} When the user is not found or password validation fails
   *
   */
  public async updatePassword(
    userId: TEntity["id"],
    newPassword: string,
  ): Promise<void> {
    return await this.credentialAuth.updatePassword(userId, newPassword);
  }

  // --- OAUTH METHODS ---

  /**
   * Authenticates a user using OAuth credentials.
   * Automatically creates a new user account if one doesn't exist for the provider.
   *
   * @param data - OAuth credentials containing provider information
   * @returns A promise that resolves to the issued authentication tokens
   * @throws {WhoamiError} When OAuth is disabled or credentials are invalid
   */
  public async loginWithOAuth(data: IOAuthCredentials): Promise<IAuthTokens> {
    return await this.oauthAuth.login(data);
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
  public async linkOAuthProvider(
    userId: TEntity["id"],
    data: IOAuthCredentials,
  ): Promise<void> {
    return await this.oauthAuth.linkProvider(userId, data);
  }

  // --- TOKEN METHODS ---

  /**
   * Refreshes authentication tokens using a valid refresh token.
   *
   * @param rawRefreshTokenString - The raw refresh token string
   * @returns A promise that resolves to a new set of authentication tokens
   * @throws {WhoamiError} When the refresh token is invalid or expired
   */
  public async refreshTokens(
    rawRefreshTokenString: string,
  ): Promise<IAuthTokens> {
    return await this.tokenOrchestrator.refreshTokens(
      rawRefreshTokenString,
      (id) => this.findUserById(id),
    );
  }

  /**
   * Verifies an access token and returns its payload.
   *
   * @param accessToken - The access token to verify
   * @returns A promise that resolves to the decoded JWT payload
   * @throws {WhoamiError} When the token is invalid, expired, or malformed
   */
  public async verifyAccessToken(accessToken: string): Promise<IJwtPayload> {
    return await this.tokenOrchestrator.verifyAccessToken(accessToken);
  }

  // --- INTERNAL ROUTING ---

  /**
   * Finds a user by ID across available repositories.
   * First checks the password repository, then the OAuth repository.
   *
   * @param userId - The ID of the user to find
   * @returns A promise that resolves to the user entity or null if not found
   * @private
   */
  private async findUserById(userId: HasId["id"]): Promise<TEntity | null> {
    if (this.deps.passwordUserRepository) {
      const user = await this.deps.passwordUserRepository.findById(userId);
      if (user) return user;
    }
    if (this.deps.oauthUserRepository) {
      return await this.deps.oauthUserRepository.findById(userId);
    }
    return null;
  }
}
