import {
  AccountAlreadyExistsError,
  AccountId,
  CredentialId,
  EmailAddress,
} from "../../../shared/index.js";
import { Account, AccountRepository } from "../../accounts/index.js";
import { Credential } from "../domain/credential.entity.js";
import { PasswordCredentialStore } from "../domain/ports/password-credential-store.port.js";
import { IssueReceiptUseCase, Receipt } from "../../receipts/index.js";

/**
 * Dependencies for {@link RegisterWithPasswordUseCase}.
 * @public
 */
export interface RegisterWithPasswordDeps {
  /** Persistence port for account aggregates. */
  accountRepo: AccountRepository;
  /** Persistence port for password credentials. */
  passwordStore: PasswordCredentialStore;
  /**
   * Deterministic ID generator — must return a non-empty string on every call.
   * Called twice: once for the account ID and once for the credential ID.
   * Inject `crypto.randomUUID` or any UUID v4 factory.
   */
  generateId: () => string;
  /**
   * Hashes a plain-text password for storage.
   * Typically `passwordManager.hash.bind(passwordManager)`.
   */
  hashPassword: (plain: string) => Promise<string>;
  /** The use-case that mints a signed receipt after registration. */
  issueReceipt: IssueReceiptUseCase;
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
   * @throws {AccountAlreadyExistsError} When an account with this email already exists.
   */
  async execute(input: RegisterWithPasswordInput): Promise<Receipt> {
    const email = new EmailAddress(input.email);

    const existing = await this.deps.passwordStore.findByEmail(email);
    if (existing) {
      throw new AccountAlreadyExistsError();
    }

    const accountId = new AccountId(this.deps.generateId());
    const account = Account.create(accountId, email);

    const hash = await this.deps.hashPassword(input.password);

    const credential = Credential.createPassword({
      id: new CredentialId(this.deps.generateId()),
      accountId,
      hash,
    });

    await this.deps.accountRepo.save(account);
    await this.deps.passwordStore.save(credential);

    return await this.deps.issueReceipt.execute(account.id);
  }
}
