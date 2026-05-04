import { Credential } from "../../../kernel/domain/entities/index.js";
import { createCredentialId } from "../../../kernel/domain/value-objects/index.js";
import {
  AccountNotFoundError,
  CredentialAlreadyExistsError,
} from "../../../kernel/domain/errors/index.js";
import { createPasswordHashProof } from "../entities/password.proof.js";
import type {
  AddPasswordToAccountInput,
  AddPasswordToAccountOutput,
  AddPasswordToAccountDeps,
} from "../password.config.js";

export class AddPasswordToAccountUseCase {
  readonly #deps: AddPasswordToAccountDeps;

  constructor(deps: AddPasswordToAccountDeps) {
    this.#deps = deps;
  }

  async execute(
    input: AddPasswordToAccountInput,
  ): Promise<AddPasswordToAccountOutput> {
    const account = await this.#deps.accountRepo.findById(input.accountId);
    if (!account) {
      throw new AccountNotFoundError(input.accountId);
    }

    const existingCredential =
      await this.#deps.passwordHashStore.findByAccountId(input.accountId);
    if (existingCredential) {
      throw new CredentialAlreadyExistsError(
        "Account already has a password. Use changePassword instead.",
      );
    }

    const passwordHash = await this.#deps.passwordHasher.hash(input.password);

    const credentialId = createCredentialId(this.#deps.idGenerator.generate());
    const credential = Credential.create({
      id: credentialId,
      accountId: input.accountId,
      proof: createPasswordHashProof(passwordHash),
    });

    await this.#deps.passwordHashStore.save(credential);

    this.#deps.logger.info("Password added to account", {
      accountId: input.accountId,
    });

    return { success: true };
  }
}
