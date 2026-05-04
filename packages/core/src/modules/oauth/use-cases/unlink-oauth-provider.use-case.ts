import { OAuthProviderNotFoundError } from "../../../kernel/domain/errors/index.js";
import type {
  UnlinkOAuthProviderInput,
  UnlinkOAuthProviderDeps,
} from "../oauth.config.js";

/**
 * Use case for unlinking an OAuth provider from an account.
 */
export class UnlinkOAuthProviderUseCase {
  readonly #deps: UnlinkOAuthProviderDeps;

  constructor(deps: UnlinkOAuthProviderDeps) {
    this.#deps = deps;
  }

  /**
   * Executes the unlink OAuth provider use case
   */
  async execute(input: UnlinkOAuthProviderInput): Promise<void> {
    const credentials = await this.#deps.oauthStore.findAllByAccountId(
      input.accountId,
    );
    const credential = credentials.find(
      (c) => c.proof.provider === input.provider,
    );

    if (!credential) {
      throw new OAuthProviderNotFoundError(input.provider);
    }

    await this.#deps.oauthStore.delete(credential.id);
  }
}
