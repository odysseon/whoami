import {
  AuthenticationError,
  WrongCredentialTypeError,
} from "../../../shared/domain/errors/auth.error.js";
import type { LoggerPort } from "../../../shared/domain/ports/logger.port.js";
import { AccountId } from "../../../shared/domain/value-objects/index.js";
import { Credential } from "../domain/credential.entity.js";
import { PasswordManager } from "../domain/ports/password-manager.port.js";

/**
 * Dependencies required by {@link VerifyPasswordUseCase}.
 */
export interface VerifyPasswordDeps {
  passwordManager: PasswordManager;
  logger: LoggerPort;
}

export interface VerifyPasswordInput {
  credential: Credential;
  plainTextPassword: string;
}

/**
 * Verifies password-based credentials and resolves the authenticated account id.
 */
export class VerifyPasswordUseCase {
  private readonly passwordManager: PasswordManager;
  private readonly logger: LoggerPort;

  constructor(deps: VerifyPasswordDeps) {
    this.passwordManager = deps.passwordManager;
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
    const { credential, plainTextPassword } = input;

    if (!credential.passwordHash) {
      this.logger.warn(
        `Wrong credential type for account ${credential.accountId.value}`,
      );
      throw new AuthenticationError();
    }

    let storedHash: string;

    try {
      storedHash = credential.passwordHash;
    } catch (error) {
      if (error instanceof WrongCredentialTypeError) {
        this.logger.warn(
          `Cross-auth anomaly for account ${credential.accountId.value}: ${error.message}`,
        );
        throw new AuthenticationError();
      }
      throw error;
    }

    const isMatch = await this.passwordManager.compare(
      plainTextPassword,
      storedHash,
    );

    if (!isMatch) {
      this.logger.warn(
        `Password verification failed for account ${credential.accountId.value}: incorrect password`,
      );
      throw new AuthenticationError();
    }

    return credential.accountId;
  }
}
