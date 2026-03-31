import {
  AuthenticationError,
  WrongCredentialTypeError,
} from "../../../shared/domain/errors/auth.error.js";
import type { LoggerPort } from "../../../shared/domain/ports/logger.port.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { EmailAddress } from "../../../shared/domain/value-objects/email-address.vo.js";
import type { CredentialStore } from "../domain/ports/credential-store.port.js";

export interface VerifyMagicLinkInput {
  rawEmail: string;
  token: string;
  currentTime: Date;
}

/**
 * Dependencies required by {@link VerifyMagicLinkUseCase}.
 */
export interface VerifyMagicLinkDeps {
  credentialStore: CredentialStore;
  logger: LoggerPort;
}

/**
 * Verifies a magic-link credential and resolves the authenticated account id.
 *
 * Magic-link tokens are single-use. The credential is deleted immediately after
 * successful verification to prevent replay attacks.
 */
export class VerifyMagicLinkUseCase {
  private readonly credentialStore: CredentialStore;
  private readonly logger: LoggerPort;

  constructor(deps: VerifyMagicLinkDeps) {
    this.credentialStore = deps.credentialStore;
    this.logger = deps.logger;
  }

  /**
   * Verifies a magic-link token and invalidates it on success so it cannot be reused.
   *
   * @param input - The verification input containing email, token, and current time.
   * @returns The authenticated account identifier.
   * @throws {AuthenticationError} When the credential does not exist or is invalid.
   */
  public async execute(input: VerifyMagicLinkInput): Promise<AccountId> {
    const email = new EmailAddress(input.rawEmail);
    const credential = await this.credentialStore.findByEmail(email);

    if (!credential) {
      this.logger.warn(
        `Magic-link verification failed: no credential found for ${email.value}`,
      );
      throw new AuthenticationError("Invalid or expired magic link.");
    }

    let isValid: boolean;

    try {
      isValid = credential.isMagicLinkValid(input.currentTime, input.token);
    } catch (error) {
      if (error instanceof WrongCredentialTypeError) {
        this.logger.warn(
          `Cross-auth anomaly on account ${credential.accountId.value}: ${error.message}`,
        );
        throw new AuthenticationError("Invalid or expired magic link.");
      }

      throw error;
    }

    if (!isValid) {
      this.logger.warn(
        `Magic-link verification failed for account ${credential.accountId.value}: token invalid or expired`,
      );
      throw new AuthenticationError("Invalid or expired magic link.");
    }

    // Single-use enforcement: remove credential so it cannot be replayed.
    // The underlying store must make this deletion atomic for concurrent flows.
    await this.credentialStore.deleteByEmail(email);

    this.logger.info(
      `Magic-link verified and invalidated for account ${credential.accountId.value}`,
    );

    return credential.accountId;
  }
}
