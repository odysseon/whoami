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
  /** Finds accounts by email address. */
  accountFinder: Pick<AccountRepository, "findByEmail">;
  /** Persists new accounts. */
  accountSaver: Pick<AccountRepository, "save">;
  /** Removes accounts (used as compensating action on credential write failure). */
  accountRemover: Pick<AccountRepository, "delete">;
  /** Finds OAuth credentials by provider name and provider-specific user ID. */
  credentialFinder: Pick<OAuthCredentialStore, "findByProvider">;
  /** Persists OAuth credentials. */
  credentialSaver: Pick<OAuthCredentialStore, "save">;
  /** Issues a signed receipt on successful authentication. */
  receiptIssuer: Pick<IssueReceiptUseCase, "execute">;
  /**
   * Deterministic ID generator — must return a non-empty string on every call.
   * Called twice when auto-registering: once for account ID, once for credential ID.
   * Inject `crypto.randomUUID` or any UUID v4 factory.
   */
  idGenerator: () => string;
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
  private readonly deps: AuthenticateOAuthDeps;

  constructor(deps: AuthenticateOAuthDeps) {
    this.deps = deps;
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
    const existingCredential = await this.deps.credentialFinder.findByProvider(
      input.provider,
      input.providerId,
    );
    if (existingCredential) {
      this.deps.logger.info(
        `OAuth fast-path: existing credential for provider ${input.provider}, ` +
          `accountId ${existingCredential.accountId.value}`,
      );
      return await this.deps.receiptIssuer.execute(
        existingCredential.accountId,
      );
    }

    // PHASE 2: conflict guard — account exists without this OAuth credential
    const existingAccount = await this.deps.accountFinder.findByEmail(email);
    if (existingAccount) {
      this.deps.logger.warn(
        `OAuth login attempt for account ${existingAccount.id.value} ` +
          `without linked ${input.provider} credential — possible account-takeover probe`,
      );
      throw new AuthenticationError(
        "An account already exists with this email. " +
          "Please log in with your password and link your OAuth account in settings.",
      );
    }

    // PHASE 3: auto-registration
    this.deps.logger.info(
      `Auto-registering new OAuth account for ${email.value}`,
    );

    const account = Account.create(
      new AccountId(this.deps.idGenerator()),
      email,
    );
    await this.deps.accountSaver.save(account);

    const credential = Credential.createOAuth({
      id: new CredentialId(this.deps.idGenerator()),
      accountId: account.id,
      provider: input.provider,
      providerId: input.providerId,
    });

    // Compensating action: if the credential write fails after the account has
    // been persisted, delete the orphaned account so the caller can safely
    // retry without hitting the conflict guard on the next attempt.
    try {
      await this.deps.credentialSaver.save(credential);
    } catch (err) {
      await this.deps.accountRemover.delete(account.id);
      throw err;
    }

    return await this.deps.receiptIssuer.execute(account.id);
  }
}
