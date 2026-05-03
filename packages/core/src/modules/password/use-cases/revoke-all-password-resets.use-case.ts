import type { AccountId } from "../../../kernel/domain/value-objects/index.js";
import type { PasswordResetTokenStore } from "../ports/password-reset-token-store.port.js";
import type {
  RevokeAllPasswordResetsInput,
  RevokeAllPasswordResetsOutput,
} from "../password.config.js";

/**
 * Use case for revoking all pending password reset tokens for an account
 */
export class RevokeAllPasswordResetsUseCase {
  readonly #resetTokenStore: PasswordResetTokenStore;

  constructor(deps: { resetTokenStore: PasswordResetTokenStore }) {
    this.#resetTokenStore = deps.resetTokenStore;
  }

  async execute(
    input: RevokeAllPasswordResetsInput,
  ): Promise<RevokeAllPasswordResetsOutput> {
    await this.#resetTokenStore.deleteAllForAccount(
      input.accountId as AccountId,
    );
    return { success: true };
  }
}
