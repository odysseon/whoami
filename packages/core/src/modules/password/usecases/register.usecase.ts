import {
  AccountAlreadyExistsError,
  AccountId,
  CredentialId,
  EmailAddress,
} from "../../../kernel/shared/index.js";
import { Account } from "../../../kernel/account/account.entity.js";
import type { AccountRepository } from "../../../kernel/account/account.repository.port.js";
import { Credential } from "../../../kernel/credential/credential.entity.js";
import type { Receipt } from "../../../kernel/receipt/receipt.entity.js";
import type { IssueReceiptUseCase } from "../../../kernel/receipt/usecases/issue-receipt.usecase.js";
import type { PasswordCredentialStore } from "../ports/password-credential.store.port.js";
import type { PasswordHasher } from "../ports/password-hasher.port.js";
import type { IdGeneratorPort } from "../../../kernel/shared/ports/id-generator.port.js";

export interface RegisterWithPasswordDeps {
  accountFinder: Pick<AccountRepository, "findByEmail">;
  accountSaver: Pick<AccountRepository, "save">;
  accountRemover: Pick<AccountRepository, "delete">;
  credentialSaver: Pick<PasswordCredentialStore, "save">;
  passwordHasher: Pick<PasswordHasher, "hash">;
  idGenerator: IdGeneratorPort;
  receiptIssuer: Pick<IssueReceiptUseCase, "execute">;
}

export interface RegisterWithPasswordInput {
  email: string;
  password: string;
}

export class RegisterWithPasswordUseCase {
  private readonly deps: RegisterWithPasswordDeps;

  constructor(deps: RegisterWithPasswordDeps) {
    this.deps = deps;
  }

  async execute(input: RegisterWithPasswordInput): Promise<Receipt> {
    const email = new EmailAddress(input.email);
    const existing = await this.deps.accountFinder.findByEmail(email);
    if (existing) throw new AccountAlreadyExistsError();

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
