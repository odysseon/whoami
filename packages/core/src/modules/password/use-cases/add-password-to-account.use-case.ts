import { Credential } from "../../../kernel/domain/entities/index.js";
import type { AccountId } from "../../../kernel/domain/value-objects/index.js";
import { createCredentialId } from "../../../kernel/domain/value-objects/index.js";
import {
  AccountNotFoundError,
  CredentialAlreadyExistsError,
} from "../../../kernel/domain/errors/index.js";
import type { AccountRepository } from "../../../kernel/ports/account-repository.port.js";
import type {
  IdGeneratorPort,
  LoggerPort,
} from "../../../kernel/ports/index.js";
import type { PasswordHashStore } from "../ports/password-hash-store.port.js";
import type { PasswordHasher } from "../ports/password-hasher.port.js";
import { createPasswordHashProof } from "../entities/password.proof.js";
import type {
  AddPasswordToAccountInput,
  AddPasswordToAccountOutput,
} from "../password.config.js";

/**
 * Use case for adding a password to an existing account
 */
export class AddPasswordToAccountUseCase {
  readonly #accountRepo: AccountRepository;
  readonly #passwordStore: PasswordHashStore;
  readonly #passwordHasher: PasswordHasher;
  readonly #idGenerator: IdGeneratorPort;
  readonly #logger: LoggerPort;

  constructor(deps: {
    accountRepo: AccountRepository;
    passwordStore: PasswordHashStore;
    passwordHasher: PasswordHasher;
    idGenerator: IdGeneratorPort;
    logger: LoggerPort;
  }) {
    this.#accountRepo = deps.accountRepo;
    this.#passwordStore = deps.passwordStore;
    this.#passwordHasher = deps.passwordHasher;
    this.#idGenerator = deps.idGenerator;
    this.#logger = deps.logger;
  }

  async execute(
    input: AddPasswordToAccountInput,
  ): Promise<AddPasswordToAccountOutput> {
    const account = await this.#accountRepo.findById(
      input.accountId as AccountId,
    );
    if (!account) {
      throw new AccountNotFoundError(input.accountId);
    }

    const existingCredential = await this.#passwordStore.findByAccountId(
      input.accountId as AccountId,
    );
    if (existingCredential) {
      throw new CredentialAlreadyExistsError(
        "Account already has a password. Use changePassword instead.",
      );
    }

    const passwordHash = await this.#passwordHasher.hash(input.password);

    const credentialId = createCredentialId(this.#idGenerator.generate());
    const credential = Credential.create({
      id: credentialId,
      accountId: input.accountId as AccountId,
      proof: createPasswordHashProof(passwordHash),
    });

    await this.#passwordStore.save(credential);

    this.#logger.info("Password added to account", {
      accountId: input.accountId,
    });

    return { success: true };
  }
}
