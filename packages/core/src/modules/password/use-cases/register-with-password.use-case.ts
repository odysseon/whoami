import { Account, Credential } from "../../../kernel/domain/entities/index.js";
import {
  createAccountId,
  createCredentialId,
} from "../../../kernel/domain/value-objects/index.js";
import { AccountAlreadyExistsError } from "../../../kernel/domain/errors/index.js";
import { createPasswordHashProof } from "../entities/password.proof.js";
import type {
  RegisterWithPasswordInput,
  RegisterWithPasswordOutput,
  RegisterWithPasswordDeps,
} from "../password.config.js";
import { parseEmail } from "../../../kernel/shared/index.js";

export class RegisterWithPasswordUseCase {
  readonly #deps: RegisterWithPasswordDeps;

  constructor(deps: RegisterWithPasswordDeps) {
    this.#deps = deps;
  }

  async execute(
    input: RegisterWithPasswordInput,
  ): Promise<RegisterWithPasswordOutput> {
    const email = parseEmail(input.email);

    const existingAccount = await this.#deps.accountRepo.findByEmail(email);
    if (existingAccount) {
      this.#deps.logger.warn("Attempted to register with existing email", {
        email: input.email,
      });
      throw new AccountAlreadyExistsError(input.email);
    }

    const accountId = createAccountId(this.#deps.idGenerator.generate());
    const account = Account.create({
      id: accountId,
      email,
    });

    const passwordHash = await this.#deps.passwordHasher.hash(input.password);

    const credentialId = createCredentialId(this.#deps.idGenerator.generate());
    const credential = Credential.create({
      id: credentialId,
      accountId,
      proof: createPasswordHashProof(passwordHash),
    });

    await this.#deps.accountRepo.save(account);
    await this.#deps.passwordHashStore.save(credential);

    this.#deps.logger.info("Account registered with password", {
      accountId: accountId.toString(),
      email: input.email,
    });

    return { account: account.toDTO() };
  }
}
