import type { AccountId } from "../../../kernel/domain/value-objects/index.js";
import {
  AccountNotFoundError,
  AuthenticationError,
} from "../../../kernel/domain/errors/index.js";
import type { AccountRepository } from "../../../kernel/ports/account-repository.port.js";
import type { LoggerPort } from "../../../kernel/ports/index.js";
import type { PasswordHashStore } from "../ports/password-hash-store.port.js";
import type { PasswordHasher } from "../ports/password-hasher.port.js";
import { createPasswordHashProof } from "../entities/password.proof.js";
import type {
  ChangePasswordInput,
  ChangePasswordOutput,
} from "../password.config.js";

/**
 * Use case for changing password
 */
export class ChangePasswordUseCase {
  readonly #accountRepo: AccountRepository;
  readonly #passwordStore: PasswordHashStore;
  readonly #passwordHasher: PasswordHasher;
  readonly #logger: LoggerPort;

  constructor(deps: {
    accountRepo: AccountRepository;
    passwordStore: PasswordHashStore;
    passwordHasher: PasswordHasher;
    logger: LoggerPort;
  }) {
    this.#accountRepo = deps.accountRepo;
    this.#passwordStore = deps.passwordStore;
    this.#passwordHasher = deps.passwordHasher;
    this.#logger = deps.logger;
  }

  async execute(input: ChangePasswordInput): Promise<ChangePasswordOutput> {
    const account = await this.#accountRepo.findById(
      input.accountId as AccountId,
    );
    if (!account) {
      throw new AccountNotFoundError(input.accountId);
    }

    const credential = await this.#passwordStore.findByAccountId(
      input.accountId as AccountId,
    );
    if (!credential) {
      throw new AuthenticationError("No password set for this account");
    }

    const proof = credential.proof;
    const isValid = await this.#passwordHasher.compare(
      input.currentPassword,
      proof.hash,
    );
    if (!isValid) {
      throw new AuthenticationError("Current password is incorrect");
    }

    const newHash = await this.#passwordHasher.hash(input.newPassword);

    await this.#passwordStore.update(
      credential.id,
      createPasswordHashProof(newHash),
    );

    this.#logger.info("Password changed", {
      accountId: input.accountId,
    });

    return { success: true };
  }
}
