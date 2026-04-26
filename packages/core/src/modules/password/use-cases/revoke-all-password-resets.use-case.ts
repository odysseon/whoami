import type { AccountId } from "../../../kernel/domain/value-objects/index.js";
import type { PasswordCredentialStore } from "../ports/password-credential-store.port.js";

/**
 * Input for revoking all password resets
 */
export interface RevokeAllPasswordResetsInput {
  readonly accountId: AccountId;
}

/**
 * Output from revoking all password resets
 */
export interface RevokeAllPasswordResetsOutput {
  readonly success: true;
}

/**
 * Use case for revoking all pending password reset tokens for an account.
 * Used for security purposes (e.g., when user suspects compromise).
 */
export class RevokeAllPasswordResetsUseCase {
  readonly #passwordStore: PasswordCredentialStore;

  constructor(deps: { passwordStore: PasswordCredentialStore }) {
    this.#passwordStore = deps.passwordStore;
  }

  /**
   * Executes the revoke all password resets use case
   * @param input - The input
   */
  async execute(
    input: RevokeAllPasswordResetsInput,
  ): Promise<RevokeAllPasswordResetsOutput> {
    await this.#passwordStore.deleteAllResetCredentialsForAccount(
      input.accountId,
    );
    return { success: true };
  }
}
