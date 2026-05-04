import type {
  RevokeAllPasswordResetsInput,
  RevokeAllPasswordResetsOutput,
  RevokeAllPasswordResetsDeps,
} from "../password.config.js";

export class RevokeAllPasswordResetsUseCase {
  readonly #deps: RevokeAllPasswordResetsDeps;

  constructor(deps: RevokeAllPasswordResetsDeps) {
    this.#deps = deps;
  }

  async execute(
    input: RevokeAllPasswordResetsInput,
  ): Promise<RevokeAllPasswordResetsOutput> {
    await this.#deps.resetTokenStore.deleteAllForAccount(input.accountId);
    return { success: true };
  }
}
