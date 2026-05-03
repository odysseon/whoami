import type { AccountId } from "../../../kernel/domain/value-objects/index.js";
import {
  AccountNotFoundError,
  AuthenticationError,
} from "../../../kernel/domain/errors/index.js";
import { createPasswordHashProof } from "../entities/password.proof.js";
import type {
  ChangePasswordInput,
  ChangePasswordOutput,
  ChangePasswordDeps,
} from "../password.config.js";

/**
 * Use case for changing password
 */
export class ChangePasswordUseCase {
  readonly #deps: ChangePasswordDeps;

  constructor(deps: ChangePasswordDeps) {
    this.#deps = deps;
  }

  async execute(input: ChangePasswordInput): Promise<ChangePasswordOutput> {
    const account = await this.#deps.accountRepo.findById(
      input.accountId as AccountId,
    );
    if (!account) {
      throw new AccountNotFoundError(input.accountId);
    }

    const credential = await this.#deps.passwordHashStore.findByAccountId(
      input.accountId as AccountId,
    );
    if (!credential) {
      throw new AuthenticationError("No password set for this account");
    }

    const proof = credential.proof;
    const isValid = await this.#deps.passwordHasher.compare(
      input.currentPassword,
      proof.hash,
    );
    if (!isValid) {
      throw new AuthenticationError("Current password is incorrect");
    }

    const newHash = await this.#deps.passwordHasher.hash(input.newPassword);

    await this.#deps.passwordHashStore.update(
      credential.id,
      createPasswordHashProof(newHash),
    );

    this.#deps.logger.info("Password changed", {
      accountId: input.accountId,
    });

    return { success: true };
  }
}
