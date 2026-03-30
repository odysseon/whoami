import {
  AuthenticationError,
  WrongCredentialTypeError,
} from "../../../shared/domain/errors/auth.error.js";
import type { LoggerPort } from "../../../shared/domain/ports/logger.port.js";
import {
  AccountId,
  EmailAddress,
} from "../../../shared/domain/value-objects/index.js";
import type { CredentialStore } from "../domain/ports/credential-store.port.js";
import type { PasswordHasher } from "../domain/ports/password-hasher.port.js";

/**
 * Dependencies required by {@link VerifyPasswordUseCase}.
 */
export interface VerifyPasswordDeps {
  credentialStore: CredentialStore;
  hasher: PasswordHasher;
  logger: LoggerPort;
}

export interface VerifyPasswordInput {
  rawEmail: string;
  plainTextPassword: string;
}

/**
 * Verifies password-based credentials and resolves the authenticated account id.
 */
export class VerifyPasswordUseCase {
  private readonly credentialStore: CredentialStore;
  private readonly hasher: PasswordHasher;
  private readonly logger: LoggerPort;

  constructor(deps: VerifyPasswordDeps) {
    this.credentialStore = deps.credentialStore;
    this.hasher = deps.hasher;
    this.logger = deps.logger;
  }

  /**
   * Verifies a password for the supplied email address.
   *
   * @param input - The email address and plain-text password to verify.
   * @returns The authenticated account identifier.
   * @throws {AuthenticationError} When the credential does not exist or is invalid.
   */
  public async execute(input: VerifyPasswordInput): Promise<AccountId> {
    const { rawEmail, plainTextPassword } = input;
    const email = new EmailAddress(rawEmail);
    const credential = await this.credentialStore.findByEmail(email);

    if (!credential) {
      this.logger.warn(
        `Password verification failed: no credential found for ${email.value}`,
      );
      throw new AuthenticationError();
    }

    let storedHash: string;

    try {
      storedHash = credential.getPasswordHash();
    } catch (error) {
      if (error instanceof WrongCredentialTypeError) {
        this.logger.warn(
          `Cross-auth anomaly for account ${credential.accountId.value}: ${error.message}`,
        );
        throw new AuthenticationError();
      }
      throw error;
    }

    const isMatch = await this.hasher.compare(plainTextPassword, storedHash);

    if (!isMatch) {
      this.logger.warn(
        `Password verification failed for account ${credential.accountId.value}: incorrect password`,
      );
      throw new AuthenticationError();
    }

    return credential.accountId;
  }
}
