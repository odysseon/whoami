import { WhoamiError } from "../../errors/whoami-error.js";
import type { IEmailPasswordCredentials } from "../../interfaces/operation-contracts/credentials.interface.js";
import type { IAuthTokens } from "../../interfaces/operation-contracts/auth-tokens.interface.js";
import type {
  HasId,
  UserWithEmail,
} from "../../interfaces/models/user.interface.js";
import type { IWhoamiAuthStatus } from "../../interfaces/operation-contracts/auth-status.interface.js";
import type { TokenOrchestrator } from "./token-orchestrator.service.js";
import type { IPasswordUserRepository } from "../../interfaces/ports/repositories/user-repository.port.js";
import type { IPasswordHasher } from "../../interfaces/ports/security/password-hasher.port.js";
import type { WhoamiServiceDependencies } from "../../interfaces/operation-contracts/auth-configuration.interface.js";

/**
 * Handles email/password credential-based authentication operations.
 * Provides methods for user registration, login, and password management.
 *
 * @typeParam TEntity - The user entity type that must satisfy the `HasId` constraint
 */
export class CredentialAuthenticator<TEntity extends HasId> {
  /**
   * Creates an instance of CredentialAuthenticator.
   *
   * @param deps - Service dependencies including repository, hasher, and logger
   * @param status - Authentication status configuration
   * @param tokens - Token orchestration service for issuing auth tokens
   */
  constructor(
    private readonly deps: WhoamiServiceDependencies<TEntity>,
    private readonly status: IWhoamiAuthStatus,
    private readonly tokens: TokenOrchestrator<TEntity>,
  ) {}

  /**
   * Registers a new user with email and password credentials.
   *
   * @param data - Email and password credentials for registration
   * @returns A promise that resolves to the created user with email information
   * @throws {WhoamiError} When email/password auth is disabled, password is empty,
   *         or email is already taken
   */
  public async register(
    data: IEmailPasswordCredentials,
  ): Promise<UserWithEmail<TEntity>> {
    this.ensureEnabled();
    if (!data.password?.trim())
      throw new WhoamiError("INVALID_CREDENTIALS", "Empty password.");

    const { repo, hasher } = this.getDeps();
    if (await repo.findByEmail(data.email)) {
      throw new WhoamiError("USER_ALREADY_EXISTS", "Email taken.");
    }

    const passwordHash = await hasher.hash(data.password);
    const user = await repo.createWithEmail({
      email: data.email,
      passwordHash,
    });
    this.deps.logger.info("Registered via email", { userId: user.id });
    return user;
  }

  /**
   * Authenticates a user using email and password credentials.
   *
   * @param data - Email and password credentials for login
   * @returns A promise that resolves to the issued authentication tokens
   * @throws {WhoamiError} When email/password auth is disabled, or credentials are invalid
   */
  public async login(data: IEmailPasswordCredentials): Promise<IAuthTokens> {
    this.ensureEnabled();
    const genericErr = new WhoamiError(
      "INVALID_CREDENTIALS",
      "Invalid email or password.",
    );
    if (!data.password?.trim()) throw genericErr;

    const { repo, hasher } = this.getDeps();
    const user = await repo.findByEmail(data.email);
    if (!user || !(await hasher.verify(user.passwordHash, data.password))) {
      throw genericErr;
    }

    this.deps.logger.info("Logged in via credentials", { userId: user.id });
    return await this.tokens.issueTokens(user.id);
  }

  /**
   * Updates the password for an existing user.
   *
   * @param userId - The ID of the user whose password is being updated
   * @param newPassword - The new password to set for the user
   * @returns A promise that resolves when the password is updated
   * @throws {WhoamiError} When email/password auth is disabled, password is empty,
   *         or user is not found
   */
  public async updatePassword(
    userId: TEntity["id"],
    newPassword: string,
  ): Promise<void> {
    this.ensureEnabled();
    if (!newPassword?.trim())
      throw new WhoamiError("INVALID_CREDENTIALS", "Empty password.");

    const { repo, hasher } = this.getDeps();
    const user = await repo.findById(userId);
    if (!user) throw new WhoamiError("USER_NOT_FOUND", "User missing.");

    const newPasswordHash = await hasher.hash(newPassword);

    await repo.updatePassword({ userId, newPasswordHash });
    this.deps.logger.info("Password updated", { userId });
  }

  /**
   * Ensures email/password authentication is enabled in the configuration.
   *
   * @throws {WhoamiError} When email/password auth is disabled
   * @private
   */
  private ensureEnabled(): void {
    if (!this.status.authMethods?.credentials)
      throw new WhoamiError("AUTH_METHOD_DISABLED", "Credentials disabled.");
  }

  /**
   * Retrieves the password user repository and password hasher from dependencies.
   *
   * @returns An object containing the repository and hasher instances
   * @throws {WhoamiError} When credential dependencies are missing
   * @private
   */
  private getDeps(): {
    repo: IPasswordUserRepository<TEntity>;
    hasher: IPasswordHasher;
  } {
    if (!this.deps.passwordUserRepository || !this.deps.passwordHasher) {
      throw new WhoamiError(
        "INVALID_CONFIGURATION",
        "Missing credential dependencies.",
      );
    }
    return {
      repo: this.deps.passwordUserRepository,
      hasher: this.deps.passwordHasher,
    };
  }
}
