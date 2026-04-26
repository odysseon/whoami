import type { AccountId } from "../../../kernel/domain/value-objects/index.js";
import {
  AccountNotFoundError,
  AuthenticationError,
} from "../../../kernel/domain/errors/index.js";
import type { AccountRepository } from "../../../kernel/ports/account-repository.port.js";
import type { LoggerPort } from "../../../kernel/ports/index.js";
import type { PasswordCredentialStore } from "../ports/password-credential-store.port.js";
import type { PasswordHasher } from "../ports/password-hasher.port.js";
import {
  createPasswordHashProof,
  isPasswordHashProof,
} from "../entities/password.proof.js";

/**
 * Input for changing password
 */
export interface ChangePasswordInput {
  readonly accountId: AccountId;
  readonly currentPassword: string;
  readonly newPassword: string;
}

/**
 * Output from changing password
 */
export interface ChangePasswordOutput {
  readonly success: true;
}

/**
 * Use case for changing password
 */
export class ChangePasswordUseCase {
  readonly #accountRepo: AccountRepository;
  readonly #passwordStore: PasswordCredentialStore;
  readonly #passwordHasher: PasswordHasher;
  readonly #logger: LoggerPort;

  constructor(deps: {
    accountRepo: AccountRepository;
    passwordStore: PasswordCredentialStore;
    passwordHasher: PasswordHasher;
    logger: LoggerPort;
  }) {
    this.#accountRepo = deps.accountRepo;
    this.#passwordStore = deps.passwordStore;
    this.#passwordHasher = deps.passwordHasher;
    this.#logger = deps.logger;
  }

  /**
   * Executes the change password use case
   * @param input - The change password input
   */
  async execute(input: ChangePasswordInput): Promise<ChangePasswordOutput> {
    // Find account
    const account = await this.#accountRepo.findById(input.accountId);
    if (!account) {
      throw new AccountNotFoundError(input.accountId.toString());
    }

    // Find password credential
    const credential = await this.#passwordStore.findByAccountId(
      input.accountId,
    );
    if (!credential) {
      throw new AuthenticationError("No password set for this account");
    }

    // Verify current password
    const proof = credential.proof;
    if (!isPasswordHashProof(proof)) {
      this.#logger.error("Credential has wrong proof type", {
        accountId: input.accountId.toString(),
        kind: proof.kind,
      });
      throw new AuthenticationError("Invalid credentials");
    }

    const isValid = await this.#passwordHasher.compare(
      input.currentPassword,
      proof.hash,
    );
    if (!isValid) {
      throw new AuthenticationError("Current password is incorrect");
    }

    // Hash new password
    const newHash = await this.#passwordHasher.hash(input.newPassword);

    // Update credential
    await this.#passwordStore.update(
      credential.id,
      createPasswordHashProof(newHash),
    );

    this.#logger.info("Password changed", {
      accountId: input.accountId.toString(),
    });

    return { success: true };
  }
}
