import type { AccountId } from "../../../kernel/domain/value-objects/index.js";
import type {
  RevokeAllPasswordResetsInput,
  RevokeAllPasswordResetsOutput,
  RevokeAllPasswordResetsDeps,
} from "../password.config.js";

/**
 * Use case for revoking all pending password reset tokens for an account
 */
export class RevokeAllPasswordResetsUseCase {
  readonly #deps: RevokeAllPasswordResetsDeps;

  constructor(deps: RevokeAllPasswordResetsDeps) {
    this.#deps = deps;
  }

  async execute(
    input: RevokeAllPasswordResetsInput,
  ): Promise<RevokeAllPasswordResetsOutput> {
    await this.#deps.resetTokenStore.deleteAllForAccount(
      input.accountId as AccountId,
    );
    return { success: true };
  }
}
