import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { EmailAddress } from "../../../shared/domain/value-objects/email-address.vo.js";
import type { CredentialStore } from "../domain/ports/credential-store.port.js";
import type { LoggerPort } from "../../../shared/domain/ports/logger.port.js";
import {
  AuthenticationError,
  WrongCredentialTypeError,
} from "../../../shared/domain/errors/auth.error.js";

export interface VerifyOAuthInput {
  rawEmail: string;
  provider: string;
  providerId: string;
}

export class VerifyOAuthUseCase {
  constructor(
    private readonly credentialStore: CredentialStore,
    private readonly logger: LoggerPort,
  ) {}

  /**
   * Verifies an OAuth credential for the supplied email address.
   *
   * @param input - The verification input containing email, provider, and providerId.
   * @returns The authenticated account identifier.
   * @throws {AuthenticationError} When the credential does not exist or is invalid.
   */
  public async execute(input: VerifyOAuthInput): Promise<AccountId> {
    const email = new EmailAddress(input.rawEmail);

    const credential = await this.credentialStore.findByEmail(email);
    if (!credential) {
      throw new AuthenticationError("Account not found or invalid credential.");
    }

    let isValid = false;
    try {
      isValid = credential.verifyOAuth(input.provider, input.providerId);
    } catch (error) {
      if (error instanceof WrongCredentialTypeError) {
        this.logger.warn(
          `Cross-auth anomaly on account ${credential.accountId.value}: ${error.message}`,
        );
        throw new AuthenticationError("Invalid authentication method.");
      }
      throw error;
    }

    if (!isValid) {
      throw new AuthenticationError("OAuth provider mismatch.");
    }

    return credential.accountId;
  }
}
