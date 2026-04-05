import { AccountId, CredentialId } from "../../shared/index.js";
import { AuthMethod } from "../../types.js";
import { AccountRepository } from "../accounts/index.js";
import {
  PasswordCredentialStore,
  PasswordManager,
  Credential,
} from "../credentials/index.js";

export interface AddPasswordCredentialDeps {
  passwordStore: PasswordCredentialStore;
  accountRepo: AccountRepository;
  hashManager: PasswordManager;
  authMethods: (accountId: AccountId) => Promise<AuthMethod[]>;
}

export interface AddPasswordCredentialInput {
  accountId: AccountId;
  password: string;
}

export class AddPasswordAuthUseCase {
  private readonly deps: AddPasswordCredentialDeps;

  constructor(deps: AddPasswordCredentialDeps) {
    this.deps = deps;
  }

  async execute(input: AddPasswordCredentialInput): Promise<void> {
    const account = await this.deps.accountRepo.findById(input.accountId);

    if (!account) throw new Error("Account not found");

    const existingMethods = await this.deps.authMethods(input.accountId);

    if (existingMethods.includes("password")) {
      throw new Error("Account already has password authentication");
    }

    const credential = Credential.createPassword({
      id: new CredentialId(String(Date.now())),
      accountId: account.id,
      hash: await this.deps.hashManager.hash(input.password),
    });

    await this.deps.passwordStore.save(credential);
  }
}
