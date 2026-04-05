import { Account } from "../accounts/domain/account.entity.js";
import { Credential } from "../credentials/domain/credential.entity.js";
import { AccountId } from "../../shared/domain/value-objects/account-id.vo.js";
import { EmailAddress } from "../../shared/domain/value-objects/email-address.vo.js";
import { CredentialId } from "../../shared/domain/value-objects/credential-id.vo.js";
import type { AccountRepository } from "../accounts/domain/account-repository.port.js";
import type { OAuthCredentialStore } from "../credentials/domain/ports/oauth-credential-store.port.js";
import type { LoggerPort } from "../../shared/domain/ports/logger.port.js";
import { AuthenticationError } from "../../shared/domain/errors/auth.error.js";
import { IssueReceiptUseCase, Receipt } from "../receipts/index.js";

export interface AuthenticateOAuthInput {
  provider: string;
  providerId: string;
  email: string;
}

export interface AuthenticateOAuthDeps {
  accountRepository: AccountRepository;
  oauthCredentialStore: OAuthCredentialStore;
  issueReceipt: IssueReceiptUseCase;
  generateId: () => string | number;
  logger: LoggerPort;
}

/**
 * Handles OAuth authentication with security-first approach:
 * 1. Fast path: Existing OAuth credential -> authenticate
 * 2. Auto-registration: No account exists -> create new
 * 3. Existing account without OAuth -> error (must link via settings)
 *
 * This prevents account takeover by requiring explicit linking
 * through the LinkOAuthToAccountUseCase which requires authentication.
 */
export class AuthenticateOAuthUseCase {
  private readonly accountRepo: AccountRepository;
  private readonly oauthStore: OAuthCredentialStore;
  private readonly issueReceipt: IssueReceiptUseCase;
  private readonly generateId: () => string | number;
  private readonly logger: LoggerPort;

  constructor(deps: AuthenticateOAuthDeps) {
    this.accountRepo = deps.accountRepository;
    this.oauthStore = deps.oauthCredentialStore;
    this.issueReceipt = deps.issueReceipt;
    this.generateId = deps.generateId;
    this.logger = deps.logger;
  }

  public async execute(input: AuthenticateOAuthInput): Promise<Receipt> {
    const email = new EmailAddress(input.email);

    // --- PHASE 1: FAST PATH - Existing OAuth User ---
    const existingCredential = await this.oauthStore.findByProvider(
      input.provider,
      input.providerId,
    );

    if (existingCredential) {
      this.logger.warn(
        `Existing OAuth credential found for provider ${input.provider}, account ${existingCredential.accountId.value}`,
      );
      return await this.issueReceipt.execute(existingCredential.accountId);
    }

    // --- PHASE 2: CHECK FOR EXISTING ACCOUNT ---
    const existingAccount = await this.accountRepo.findByEmail(email);

    if (existingAccount) {
      // Security: Account exists but doesn't have this OAuth credential
      // Cannot auto-link without authentication
      this.logger.warn(
        `OAuth login attempt for existing account ${existingAccount.id.value} without linked OAuth credential. ` +
          `Provider: ${input.provider}, Email: ${email.value}`,
      );

      throw new AuthenticationError(
        "An account already exists with this email. " +
          "Please log in with your password and link your OAuth account in settings.",
      );
    }

    // --- PHASE 3: AUTO-REGISTRATION - Create New Account ---
    this.logger.info(
      `Auto-registering new account for OAuth user: ${email.value}`,
    );

    const account = Account.create(new AccountId(this.generateId()), email);
    await this.accountRepo.save(account);

    const credential = Credential.createOAuth({
      id: new CredentialId(this.generateId()),
      accountId: account.id,
      provider: input.provider,
      providerId: input.providerId,
    });

    await this.oauthStore.save(credential);

    const receipt = this.issueReceipt.execute(account.id);
    return await receipt;
  }
}
