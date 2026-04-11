import {
  AccountAlreadyExistsError,
  AccountId,
  CredentialId,
  EmailAddress,
} from "../../../shared/index.js";
import { Account, AccountRepository } from "../../accounts/index.js";
import { Credential } from "../domain/credential.entity.js";
import { PasswordCredentialStore } from "../domain/ports/password-credential-store.port.js";
import { PasswordManager } from "../domain/ports/password-manager.port.js";
import type { Receipt } from "../../receipts/index.js";
import type { IssueReceiptUseCase } from "../../receipts/application/issue-receipt.usecase.js";

/**
 * Dependencies for {@link RegisterWithPasswordUseCase}.
 * @public
 */
export interface RegisterWithPasswordDeps {
  /** Finds accounts by email address. */
  accountFinder: Pick<AccountRepository, "findByEmail">;
  /** Persists new accounts. */
  accountSaver: Pick<AccountRepository, "save">;
  /** Removes accounts (used as compensating action). */
  accountRemover: Pick<AccountRepository, "delete">;
  /** Persists password credentials. */
  credentialSaver: Pick<PasswordCredentialStore, "save">;
  /** Hashes plain-text passwords for storage. */
  passwordHasher: Pick<PasswordManager, "hash">;
  /**
   * Deterministic ID generator — must return a non-empty string on every call.
   * Called twice: once for the account ID and once for the credential ID.
   * Inject `crypto.randomUUID` or any UUID v4 factory.
   */
  idGenerator: () => string;
  /** Issues a signed receipt after successful registration. */
  receiptIssuer: Pick<IssueReceiptUseCase, "execute">;
}

/**
 * Input for {@link RegisterWithPasswordUseCase.execute}.
 * @public
 */
export interface RegisterWithPasswordInput {
  /** Raw email address string for the new account. */
  email: string;
  /** Plain-text password; will be hashed before storage. */
  password: string;
}

/**
 * Registers a new account with password-based authentication.
 *
 * Creates both the {@link Account} and the password {@link Credential} in a
 * single operation and immediately returns a signed {@link Receipt}, so the
 * caller is authenticated without a separate login step.
 *
 * @public
 */
export class RegisterWithPasswordUseCase {
  private readonly deps: RegisterWithPasswordDeps;

  constructor(deps: RegisterWithPasswordDeps) {
    this.deps = deps;
  }

  /**
   * Registers the account and returns a signed receipt.
   *
   * @param input - {@link RegisterWithPasswordInput}
   * @returns A signed {@link Receipt} for the newly created account.
   * @throws {InvalidEmailError} When the email address is malformed.
   * @throws {AccountAlreadyExistsError} When an account with this email already exists,
   *         whether registered via password or any other method such as OAuth.
   */
  async execute(input: RegisterWithPasswordInput): Promise<Receipt> {
    const email = new EmailAddress(input.email);

    const existingAccount = await this.deps.accountFinder.findByEmail(email);
    if (existingAccount) {
      throw new AccountAlreadyExistsError();
    }

    const accountId = new AccountId(this.deps.idGenerator());
    const account = Account.create(accountId, email);

    const hash = await this.deps.passwordHasher.hash(input.password);

    const credential = Credential.createPassword({
      id: new CredentialId(this.deps.idGenerator()),
      accountId,
      hash,
    });

    await this.deps.accountSaver.save(account);

    try {
      await this.deps.credentialSaver.save(credential);
    } catch (err) {
      await this.deps.accountRemover.delete(account.id);
      throw err;
    }

    return await this.deps.receiptIssuer.execute(account.id);
  }
}
