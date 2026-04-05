import { Credential } from "../domain/credential.entity.js";
import { CredentialId } from "../../../shared/domain/value-objects/credential-id.vo.js";
import type { AccountRepository } from "../../accounts/domain/account-repository.port.js";
import type { OAuthCredentialStore } from "../domain/ports/oauth-credential-store.port.js";
import type { LoggerPort } from "../../../shared/domain/ports/logger.port.js";
import { VerifyReceiptUseCase } from "../../receipts/index.js";
import { AuthenticationError } from "../../../shared/domain/errors/auth.error.js";

export interface LinkOAuthToAccountInput {
  /** The authenticated user's receipt token (session) */
  receiptToken: string;
  /** OAuth provider (e.g., "google", "github") */
  provider: string;
  /** OAuth provider's user identifier */
  providerId: string;
  /** Email from OAuth provider (must match account email) */
  email: string;
}

export interface LinkOAuthToAccountDeps {
  accountRepository: AccountRepository;
  oauthCredentialStore: OAuthCredentialStore;
  verifyReceipt: VerifyReceiptUseCase;
  generateId: () => string | number;
  logger: LoggerPort;
}

/**
 * Links an OAuth credential to an existing account.
 *
 * Security requirements:
 * - User must be authenticated (valid receipt)
 * - OAuth email must match the authenticated account's email
 * - Prevents linking if OAuth credential already exists for another account
 */
export class LinkOAuthToAccountUseCase {
  private readonly accountRepo: AccountRepository;
  private readonly oauthStore: OAuthCredentialStore;
  private readonly verifyReceipt: VerifyReceiptUseCase;
  private readonly generateId: () => string | number;
  private readonly logger: LoggerPort;

  constructor(deps: LinkOAuthToAccountDeps) {
    this.accountRepo = deps.accountRepository;
    this.oauthStore = deps.oauthCredentialStore;
    this.verifyReceipt = deps.verifyReceipt;
    this.generateId = deps.generateId;
    this.logger = deps.logger;
  }

  /**
   * Links an OAuth credential to an authenticated account.
   *
   * @throws {AuthenticationError} If receipt is invalid, email mismatch,
   *         or credential already exists for another account
   */
  public async execute(input: LinkOAuthToAccountInput): Promise<void> {
    // --- PHASE 1: VERIFY AUTHENTICATION ---
    const receipt = await this.verifyReceipt.execute(input.receiptToken);
    const authenticatedAccountId = receipt.accountId;

    // --- PHASE 2: VERIFY EMAIL MATCH ---
    const account = await this.accountRepo.findById(authenticatedAccountId);
    if (!account) {
      this.logger.error(
        `Account ${authenticatedAccountId.value} not found despite valid receipt`,
      );
      throw new AuthenticationError("Account not found.");
    }

    if (account.email.value !== input.email) {
      this.logger.warn(
        `Email mismatch during OAuth linking. Account: ${account.email.value}, ` +
          `OAuth email: ${input.email}, Account ID: ${account.id.value}`,
      );
      throw new AuthenticationError(
        "The OAuth account email does not match your account email.",
      );
    }

    // --- PHASE 3: CHECK FOR EXISTING CREDENTIAL ---
    const existingCredential = await this.oauthStore.findByProvider(
      input.provider,
      input.providerId,
    );

    if (existingCredential) {
      // If already linked to this account, it's idempotent - success
      if (existingCredential.accountId.equals(account.id)) {
        this.logger.info(
          `OAuth credential already linked to account ${account.id.value}`,
        );
        return;
      }

      // Credential belongs to another account - security violation
      this.logger.error(
        `Attempted to link OAuth credential to account ${account.id.value} but it's ` +
          `already linked to account ${existingCredential.accountId.value}`,
      );
      throw new AuthenticationError(
        "This OAuth account is already linked to another user.",
      );
    }

    // --- PHASE 4: CREATE AND SAVE NEW CREDENTIAL ---
    this.logger.info(
      `Linking ${input.provider} OAuth credential to account ${account.id.value}`,
    );

    const credential = Credential.createOAuth({
      id: new CredentialId(this.generateId()),
      accountId: account.id,
      provider: input.provider,
      providerId: input.providerId,
    });

    await this.oauthStore.save(credential);
  }
}
