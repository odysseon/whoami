import {
  AccountAlreadyExistsError,
  AccountId,
  CredentialId,
  EmailAddress,
} from "../../../shared/index.js";
import { Account, AccountRepository } from "../../accounts/index.js";
import { Credential } from "../domain/credential.entity.js";
import { PasswordCredentialStore } from "../domain/ports/password-credential-store.port.js";

export interface RegisterWithPasswordDeps {
  accountRepo: AccountRepository;
  passwordStore: PasswordCredentialStore;
  generateId: () => string | number;
  hashPassword: (plain: string) => Promise<string>;
}

export interface RegisterWithPasswordInput {
  email: string;
  password: string;
}

/**
 * Registers a new account with password-based authentication.
 *
 * Creates an account and a password credential atomically. If either operation
 * fails, implementations should ensure consistency through transactions or
 * compensating actions.
 *
 * @throws {AccountAlreadyExistsError} When an account with the email already exists.
 * @throws {Error} When password hashing fails.
 */
export class RegisterWithPasswordUseCase {
  private readonly deps: RegisterWithPasswordDeps;
  constructor(deps: RegisterWithPasswordDeps) {
    this.deps = deps;
  }

  async execute(input: RegisterWithPasswordInput): Promise<Account> {
    const email = new EmailAddress(input.email);
    const existing = await this.deps.passwordStore.findByEmail(email);

    if (existing) {
      throw new AccountAlreadyExistsError();
    }

    const accountId = new AccountId(this.deps.generateId());
    const account = Account.create(accountId, email);
    const hashed = await this.deps.hashPassword(input.password);
    const credential = Credential.createPassword({
      id: new CredentialId(this.deps.generateId()),
      accountId,
      hash: hashed,
    });

    await this.deps.accountRepo.save(account);
    await this.deps.passwordStore.save(credential);

    return account;
  }
}
