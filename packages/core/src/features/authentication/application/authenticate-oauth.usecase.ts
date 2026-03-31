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

export interface AuthenticateOAuthInput {
  rawEmail: string;
  provider: string;
  providerId: string;
}

/**
 * Dependencies required by {@link AuthenticateOAuthUseCase}.
 */
export interface AuthenticateOAuthDeps {
  accountRepository: AccountRepository;
  credentialStore: CredentialStore;
  generateId: () => string | number;
  logger: LoggerPort;
}

/**
 * Handles the full OAuth authentication flow: auto-registers new users or
 * verifies the OAuth credential for returning users.
 */
export class AuthenticateOAuthUseCase {
  private readonly accountRepo: AccountRepository;
  private readonly credentialStore: CredentialStore;
  private readonly generateId: () => string | number;
  private readonly logger: LoggerPort;

  constructor(deps: AuthenticateOAuthDeps) {
    this.accountRepo = deps.accountRepository;
    this.credentialStore = deps.credentialStore;
    this.generateId = deps.generateId;
    this.logger = deps.logger;
  }

  /**
   * Authenticates or auto-registers an account via OAuth.
   *
   * @param input - The OAuth authentication input.
   * @returns The authenticated account identifier.
   * @throws {AuthenticationError} When an existing credential fails verification.
   */
  public async execute(input: AuthenticateOAuthInput): Promise<AccountId> {
    const email = new EmailAddress(input.rawEmail);

    // --- PHASE 1: THE ACCOUNT (The VIP) ---
    let account = await this.accountRepo.findByEmail(email);

    if (!account) {
      this.logger.info(`Auto-registering new OAuth user: ${email.value}`);
      account = Account.create(new AccountId(this.generateId()), email);
      await this.accountRepo.save(account);
    }

    // --- PHASE 2: THE CREDENTIAL (The Proof) ---
    let credential = await this.credentialStore.findByEmail(email);

    if (!credential) {
      this.logger.info(
        `Linking new ${input.provider} credential to account ${account.id.value}`,
      );
      credential = Credential.createOAuth(new CredentialId(this.generateId()), {
        accountId: account.id,
        provider: input.provider,
        providerId: input.providerId,
      });
      await this.credentialStore.save(credential);

      return account.id;
    }

    // --- PHASE 3: VERIFICATION (Existing Users) ---
    try {
      const isValid = credential.verifyOAuth(input.provider, input.providerId);
      if (!isValid) {
        throw new AuthenticationError("OAuth provider mismatch.");
      }
    } catch (error) {
      if (error instanceof WrongCredentialTypeError) {
        this.logger.warn(
          `Account linking anomaly on ${account.id.value}. Expected ${error.message}`,
        );
        throw new AuthenticationError(
          "Please log in with your original authentication method.",
        );
      }
      throw error;
    }

    return credential.accountId;
  }
}
