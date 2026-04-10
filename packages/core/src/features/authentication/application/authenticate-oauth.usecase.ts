import { Account } from "../../accounts/domain/account.entity.js";
import { Credential } from "../../credentials/domain/credential.entity.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { EmailAddress } from "../../../shared/domain/value-objects/email-address.vo.js";
import { CredentialId } from "../../../shared/domain/value-objects/credential-id.vo.js";
import type { AccountRepository } from "../../accounts/domain/account-repository.port.js";
import type { OAuthCredentialStore } from "../../credentials/domain/ports/oauth-credential-store.port.js";
import type { LoggerPort } from "../../../shared/domain/ports/logger.port.js";
import { AuthenticationError } from "../../../shared/domain/errors/auth.error.js";
import type { Receipt } from "../../receipts/index.js";
import type { IssueReceiptUseCase } from "../../receipts/application/issue-receipt.usecase.js";

/**
 * Input for {@link AuthenticateOAuthUseCase.execute}.
 * @public
 */
export interface AuthenticateOAuthInput {
  /** OAuth provider name (e.g. `"google"`, `"github"`). */
  provider: string;
  /** The stable user identifier returned by the OAuth provider (`sub` claim). */
  providerId: string;
  /** Email address returned by the OAuth provider. */
  email: string;
}

/**
 * Dependencies for {@link AuthenticateOAuthUseCase}.
 * @public
 */
export interface AuthenticateOAuthDeps {
  /** Persistence port for account aggregates. */
  accountRepository: AccountRepository;
  /** Persistence port for OAuth credentials. */
  oauthCredentialStore: OAuthCredentialStore;
  /** Use-case that mints a signed receipt on success. */
  issueReceipt: Pick<IssueReceiptUseCase, "execute">;
  /**
   * Deterministic ID generator — must return a non-empty string on every call.
   * Called twice when auto-registering: once for account ID, once for credential ID.
   * Inject `crypto.randomUUID` or any UUID v4 factory.
   */
  generateId: () => string;
  /** Structured logger. */
  logger: LoggerPort;
}

/**
 * Authenticates a user via OAuth with a security-first three-phase flow:
 *
 * 1. **Fast path** — An OAuth credential already exists → authenticate immediately.
 * 2. **Conflict guard** — An account exists with this email but no OAuth credential →
 *    reject to prevent account takeover (user must link via settings).
 * 3. **Auto-registration** — No account exists → create account + credential, then authenticate.
 *
 * @public
 */
export class AuthenticateOAuthUseCase {
  private readonly accountRepo: AccountRepository;
  private readonly oauthStore: OAuthCredentialStore;
  private readonly issueReceipt: Pick<IssueReceiptUseCase, "execute">;
  private readonly generateId: () => string;
  private readonly logger: LoggerPort;

  constructor(deps: AuthenticateOAuthDeps) {
    this.accountRepo = deps.accountRepository;
    this.oauthStore = deps.oauthCredentialStore;
    this.issueReceipt = deps.issueReceipt;
    this.generateId = deps.generateId;
    this.logger = deps.logger;
  }

  /**
   * Runs the OAuth authentication flow and returns a signed receipt.
   *
   * @param input - {@link AuthenticateOAuthInput}
   * @returns A signed {@link Receipt} for the authenticated account.
   * @throws {InvalidEmailError} When the email address is malformed.
   * @throws {AuthenticationError} When an account exists with this email but
   *         the OAuth credential is not yet linked.
   */
  public async execute(input: AuthenticateOAuthInput): Promise<Receipt> {
    const email = new EmailAddress(input.email);

    // PHASE 1: fast path — existing OAuth credential
    const existingCredential = await this.oauthStore.findByProvider(
      input.provider,
      input.providerId,
    );
    if (existingCredential) {
      this.logger.info(
        `OAuth fast-path: existing credential for provider ${input.provider}, ` +
          `accountId ${existingCredential.accountId.value}`,
      );
      return await this.issueReceipt.execute(existingCredential.accountId);
    }

    // PHASE 2: conflict guard — account exists without this OAuth credential
    const existingAccount = await this.accountRepo.findByEmail(email);
    if (existingAccount) {
      this.logger.warn(
        `OAuth login attempt for existing account ${existingAccount.id.value} ` +
          `without linked ${input.provider} credential. Email: ${email.value}`,
      );
      throw new AuthenticationError(
        "An account already exists with this email. " +
          "Please log in with your password and link your OAuth account in settings.",
      );
    }

    // PHASE 3: auto-registration
    this.logger.info(`Auto-registering new OAuth account for ${email.value}`);

    const account = Account.create(new AccountId(this.generateId()), email);
    await this.accountRepo.save(account);

    const credential = Credential.createOAuth({
      id: new CredentialId(this.generateId()),
      accountId: account.id,
      provider: input.provider,
      providerId: input.providerId,
    });

    // Compensating action: if the credential write fails after the account has
    // been persisted, delete the orphaned account so the caller can safely
    // retry without hitting the conflict guard on the next attempt.
    try {
      await this.oauthStore.save(credential);
    } catch (err) {
      await this.accountRepo.delete(account.id);
      throw err;
    }

    return await this.issueReceipt.execute(account.id);
  }
}
