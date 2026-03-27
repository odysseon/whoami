import { AccountId } from "src/shared/domain/value-objects/account-id.vo.js";
import { CredentialStore } from "../domain/ports/credential-store.port.js";
import { EmailAddress } from "src/shared/domain/value-objects/email-address.vo.js";
import {
  AuthenticationError,
  WrongCredentialTypeError,
} from "src/shared/domain/errors/auth.error.js";
import { LoggerPort } from "src/shared/domain/ports/logger.port.js";

export class VerifyMagicLinkUseCase {
  constructor(
    private readonly credentialStore: CredentialStore,
    private readonly logger: LoggerPort,
  ) {}

  public async execute(
    rawEmail: string,
    token: string,
    currentTime: Date,
  ): Promise<AccountId> {
    // 1. Validate primitive
    const email = new EmailAddress(rawEmail);

    // 2. Fetch via Port
    const credential = await this.credentialStore.findByEmail(email);
    if (!credential) {
      throw new AuthenticationError("Invalid or expired magic link.");
    }

    // 3. The LSP Guardian & Cross-Auth Trap
    let isValid: boolean;
    try {
      isValid = credential.isMagicLinkValid(currentTime, token);
    } catch (error) {
      if (error instanceof WrongCredentialTypeError) {
        this.logger.warn(
          `Cross-auth anomaly on account ${credential.accountId.value}: ${error.message}`,
        );
        // Mask the true error from the outside world
        throw new AuthenticationError("Invalid or expired magic link.");
      }
      throw error;
    }

    if (!isValid) {
      throw new AuthenticationError("Invalid or expired magic link.");
    }

    // 4. Success!
    return credential.accountId;
  }
}
