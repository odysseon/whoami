import type { AccountId } from "../../../kernel/domain/value-objects/index.js";
import type { PasswordResetTokenStore } from "../ports/password-reset-token-store.port.js";

export interface RevokeAllPasswordResetsInput {
  readonly accountId: AccountId;
}

export interface RevokeAllPasswordResetsOutput {
  readonly success: true;
}

/**
 * Use case for revoking all pending password reset tokens for an account.
 * Used when a user suspects compromise or explicitly cancels pending resets.
 */
export class RevokeAllPasswordResetsUseCase {
  readonly #resetTokenStore: PasswordResetTokenStore;

  constructor(deps: { resetTokenStore: PasswordResetTokenStore }) {
    this.#resetTokenStore = deps.resetTokenStore;
  }

  async execute(
    input: RevokeAllPasswordResetsInput,
  ): Promise<RevokeAllPasswordResetsOutput> {
    await this.#resetTokenStore.deleteAllForAccount(input.accountId);
    return { success: true };
  }
}
