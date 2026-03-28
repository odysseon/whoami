import { Account } from "../../accounts/domain/account.entity.js";
import { Credential } from "../domain/credential.entity.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { EmailAddress } from "../../../shared/domain/value-objects/email-address.vo.js";
import { CredentialId } from "../../../shared/domain/value-objects/credential-id.vo.js";
import type { AccountRepository } from "../../accounts/domain/account-repository.port.js";
import type { CredentialStore } from "../domain/ports/credential-store.port.js";
import type { LoggerPort } from "../../../shared/domain/ports/logger.port.js";
import {
  AuthenticationError,
  WrongCredentialTypeError,
} from "../../../shared/domain/errors/auth.error.js";

export class AuthenticateOAuthOrchestrator {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly credentialStore: CredentialStore,
    private readonly generateId: () => string | number,
    private readonly logger: LoggerPort,
  ) {}

  public async execute(
    rawEmail: string,
    provider: string,
    providerId: string,
  ): Promise<AccountId> {
    const email = new EmailAddress(rawEmail);

    // --- PHASE 1: THE ACCOUNT (The VIP) ---
    let account = await this.accountRepo.findByEmail(email);

    if (!account) {
      this.logger.info(`Auto-registering new OAuth user: ${email.value}`);
      // Auto-Registration
      account = Account.create(new AccountId(this.generateId()), email);
      await this.accountRepo.save(account);
    }

    // --- PHASE 2: THE CREDENTIAL (The Proof) ---
    let credential = await this.credentialStore.findByEmail(email);

    if (!credential) {
      this.logger.info(
        `Linking new ${provider} credential to account ${account.id.value}`,
      );
      // Create and link the OAuth credential
      credential = Credential.createOAuth(
        new CredentialId(this.generateId()),
        account.id,
        provider,
        providerId,
      );
      await this.credentialStore.save(credential);

      return account.id; // Brand new setup complete
    }

    // --- PHASE 3: VERIFICATION (Existing Users) ---
    try {
      const isValid = credential.verifyOAuth(provider, providerId);
      if (!isValid) {
        throw new AuthenticationError("OAuth provider mismatch.");
      }
    } catch (error) {
      if (error instanceof WrongCredentialTypeError) {
        // SECURITY TRAP: The user signed up with a Password months ago,
        // but just clicked "Sign in with Google".
        this.logger.warn(
          `Account linking anomaly on ${account.id.value}. Expected ${error.message}`,
        );
        // We reject the login to prevent an attacker from hijacking an account
        // if they somehow spoofed the Google email.
        throw new AuthenticationError(
          "Please log in with your original authentication method.",
        );
      }
      throw error;
    }

    return credential.accountId;
  }
}
