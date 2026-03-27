import {
  AuthenticationError,
  WrongCredentialTypeError,
} from "../../../shared/domain/errors/auth.error.js";
import type { LoggerPort } from "../../../shared/domain/ports/logger.port.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { EmailAddress } from "../../../shared/domain/value-objects/email-address.vo.js";
import type { CredentialStore } from "../domain/ports/credential-store.port.js";

/**
 * Verifies a magic-link credential and resolves the authenticated account id.
 */
export class VerifyMagicLinkUseCase {
  constructor(
    private readonly credentialStore: CredentialStore,
    private readonly logger: LoggerPort,
  ) {}

  /**
   * Verifies a magic-link token for the supplied email address.
   *
   * @param rawEmail - The email address associated with the credential.
   * @param token - The token presented by the client.
   * @param currentTime - The current clock value used for expiry checks.
   * @returns The authenticated account identifier.
   * @throws {AuthenticationError} When the credential does not exist or is invalid.
   */
  public async execute(
    rawEmail: string,
    token: string,
    currentTime: Date,
  ): Promise<AccountId> {
    const email = new EmailAddress(rawEmail);
    const credential = await this.credentialStore.findByEmail(email);

    if (!credential) {
      throw new AuthenticationError("Invalid or expired magic link.");
    }

    let isValid: boolean;

    try {
      isValid = credential.isMagicLinkValid(currentTime, token);
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
      throw new AuthenticationError("Invalid or expired magic link.");
    }

    return credential.accountId;
  }
}
