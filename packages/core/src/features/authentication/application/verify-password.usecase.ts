import {
  AccountId,
  EmailAddress,
} from "src/shared/domain/value-objects/index.js";
import { CredentialStore } from "../domain/ports/credential-store.port.js";
import { PasswordHasher } from "../domain/ports/password-hasher.port.js";
import { AuthenticationError } from "src/shared/domain/errors/auth.error.js";
import { WrongCredentialTypeError } from "src/shared/domain/errors/auth.error.js";
import { LoggerPort } from "src/shared/domain/ports/logger.port.js";

export class VerifyPasswordUseCase {
  constructor(
    private readonly credentialStore: CredentialStore,
    private readonly hasher: PasswordHasher,
    private readonly logger: LoggerPort,
  ) {}

  public async execute(
    rawEmail: string,
    plainTextPassword: string,
  ): Promise<AccountId> {
    const email = new EmailAddress(rawEmail);

    const credential = await this.credentialStore.findByEmail(email);
    if (!credential) {
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
      throw new AuthenticationError();
    }

    return credential.accountId;
  }
}
