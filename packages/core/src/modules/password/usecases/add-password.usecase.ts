import {
  AccountNotFoundError,
  CredentialAlreadyExistsError,
  CredentialId,
} from "../../../kernel/shared/index.js";
import type { AccountId } from "../../../kernel/shared/index.js";
import type { AccountRepository } from "../../../kernel/account/account.repository.port.js";
import { Credential } from "../../../kernel/credential/credential.entity.js";
import type { PasswordCredentialStore } from "../ports/password-credential.store.port.js";
import type { PasswordHasher } from "../ports/password-hasher.port.js";
import type { IdGeneratorPort } from "../../../kernel/shared/ports/id-generator.port.js";

export interface AddPasswordDeps {
  accountFinder: Pick<AccountRepository, "findById">;
  credentialChecker: Pick<PasswordCredentialStore, "existsForAccount">;
  credentialSaver: Pick<PasswordCredentialStore, "save">;
  passwordHasher: Pick<PasswordHasher, "hash">;
  idGenerator: IdGeneratorPort;
}

export interface AddPasswordInput {
  accountId: AccountId;
  password: string;
}

export class AddPasswordUseCase {
  private readonly deps: AddPasswordDeps;

  constructor(deps: AddPasswordDeps) {
    this.deps = deps;
  }

  async execute(input: AddPasswordInput): Promise<void> {
    const account = await this.deps.accountFinder.findById(input.accountId);
    if (!account) throw new AccountNotFoundError(input.accountId.value);

    const alreadyHasPassword =
      await this.deps.credentialChecker.existsForAccount(input.accountId);
    if (alreadyHasPassword) throw new CredentialAlreadyExistsError();

    const hash = await this.deps.passwordHasher.hash(input.password);
    const credential = Credential.createPassword({
      id: new CredentialId(this.deps.idGenerator()),
      accountId: account.id,
      hash,
    });

    await this.deps.credentialSaver.save(credential);
  }
}
