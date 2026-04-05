import { Credential } from "../domain/credential.entity.js";
import { CredentialId } from "../../../shared/domain/value-objects/credential-id.vo.js";
import type { AccountRepository } from "../../accounts/domain/account-repository.port.js";
import type { OAuthCredentialStore } from "../domain/ports/oauth-credential-store.port.js";
import type { LoggerPort } from "../../../shared/domain/ports/logger.port.js";
import { VerifyReceiptUseCase } from "../../receipts/index.js";
import { AuthenticationError } from "../../../shared/domain/errors/auth.error.js";

/**
 * Input for {@link LinkOAuthToAccountUseCase.execute}.
 * @public
 */
export interface LinkOAuthToAccountInput {
  /** The authenticated user's current receipt token. */
  receiptToken: string;
  /** OAuth provider name (e.g. `"google"`, `"github"`). */
  provider: string;
  /** The stable user identifier returned by the OAuth provider. */
  providerId: string;
  /** Email address returned by the OAuth provider — must match the account email. */
  email: string;
}

/**
 * Dependencies for {@link LinkOAuthToAccountUseCase}.
 * @public
 */
export interface LinkOAuthToAccountDeps {
  /** Persistence port for account aggregates. */
  accountRepository: AccountRepository;
  /** Persistence port for OAuth credentials. */
  oauthCredentialStore: OAuthCredentialStore;
  /** Use-case that verifies the caller's receipt token. */
  verifyReceipt: VerifyReceiptUseCase;
  /**
   * Deterministic ID generator — must return a non-empty string on every call.
   * Inject `crypto.randomUUID` or any UUID v4 factory.
   */
  generateId: () => string;
  /** Structured logger. */
  logger: LoggerPort;
}

/**
 * Links an OAuth credential to an existing, authenticated account.
 *
 * Security requirements enforced by this use-case:
 * - The caller must supply a valid receipt token (i.e. be already authenticated).
 * - The OAuth provider email must match the account's registered email address.
 * - The OAuth credential must not already be linked to a *different* account.
 *
 * If the credential is already linked to *this* account the operation is
 * idempotent — it succeeds silently.
 *
 * @public
 */
export class LinkOAuthToAccountUseCase {
  private readonly accountRepo: AccountRepository;
  private readonly oauthStore: OAuthCredentialStore;
  private readonly verifyReceipt: VerifyReceiptUseCase;
  private readonly generateId: () => string;
  private readonly logger: LoggerPort;

  constructor(deps: LinkOAuthToAccountDeps) {
    this.accountRepo = deps.accountRepository;
    this.oauthStore = deps.oauthCredentialStore;
    this.verifyReceipt = deps.verifyReceipt;
    this.generateId = deps.generateId;
    this.logger = deps.logger;
  }

  /**
   * Links the OAuth credential to the authenticated account.
   *
   * @param input - {@link LinkOAuthToAccountInput}
   * @throws {InvalidReceiptError} When the receipt token is invalid or expired.
   * @throws {AuthenticationError} When the account is not found, the email does
   *         not match, or the OAuth credential already belongs to another account.
   */
  public async execute(input: LinkOAuthToAccountInput): Promise<void> {
    // PHASE 1: verify the caller is authenticated
    const receipt = await this.verifyReceipt.execute(input.receiptToken);
    const authenticatedAccountId = receipt.accountId;

    // PHASE 2: load the account and verify email matches
    const account = await this.accountRepo.findById(authenticatedAccountId);
    if (!account) {
      this.logger.error(
        `Account ${authenticatedAccountId.value} not found despite valid receipt`,
      );
      throw new AuthenticationError("Account not found.");
    }

    if (account.email.value !== input.email.trim().toLowerCase()) {
      this.logger.warn(
        `Email mismatch during OAuth linking — account: ${account.email.value}, ` +
          `OAuth email: ${input.email}, accountId: ${account.id.value}`,
      );
      throw new AuthenticationError(
        "The OAuth account email does not match your account email.",
      );
    }

    // PHASE 3: check for an existing credential for this provider/providerId
    const existing = await this.oauthStore.findByProvider(
      input.provider,
      input.providerId,
    );

    if (existing) {
      if (existing.accountId.equals(account.id)) {
        // Already linked to this account — idempotent success
        this.logger.info(
          `OAuth credential already linked to account ${account.id.value}`,
        );
        return;
      }
      this.logger.error(
        `Attempted to link OAuth credential to account ${account.id.value} ` +
          `but it is already linked to account ${existing.accountId.value}`,
      );
      throw new AuthenticationError(
        "This OAuth account is already linked to another user.",
      );
    }

    // PHASE 4: create and persist the new credential
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
