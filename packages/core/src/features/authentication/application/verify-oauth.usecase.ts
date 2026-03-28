import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { EmailAddress } from "../../../shared/domain/value-objects/email-address.vo.js";
import type { CredentialStore } from "../domain/ports/credential-store.port.js";
import type { LoggerPort } from "../../../shared/domain/ports/logger.port.js";
import {
  AuthenticationError,
  WrongCredentialTypeError,
} from "../../../shared/domain/errors/auth.error.js";

export class VerifyOAuthUseCase {
  constructor(
    private readonly credentialStore: CredentialStore,
    private readonly logger: LoggerPort,
  ) {}

  public async execute(
    rawEmail: string,
    provider: string,
    providerId: string,
  ): Promise<AccountId> {
    const email = new EmailAddress(rawEmail);

    const credential = await this.credentialStore.findByEmail(email);
    if (!credential) {
      throw new AuthenticationError("Account not found or invalid credential.");
    }

    let isValid = false;
    try {
      isValid = credential.verifyOAuth(provider, providerId);
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
