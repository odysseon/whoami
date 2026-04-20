import type { AccountId } from "../../../kernel/domain/value-objects/index.js";
import { OAuthProviderNotFoundError } from "../../../kernel/domain/errors/index.js";
import type { OAuthCredentialStore } from "../ports/oauth-credential-store.port.js";

/**
 * Input for unlinking OAuth provider
 */
export interface UnlinkOAuthProviderInput {
  readonly accountId: AccountId;
  readonly provider: string;
}

/**
 * Output from unlinking OAuth provider
 */
export interface UnlinkOAuthProviderOutput {
  readonly success: true;
}

/**
 * Use case for unlinking an OAuth provider from an account.
 */
export class UnlinkOAuthProviderUseCase {
  readonly #oauthStore: OAuthCredentialStore;

  constructor(deps: { oauthStore: OAuthCredentialStore }) {
    this.#oauthStore = deps.oauthStore;
  }

  /**
   * Executes the unlink OAuth provider use case
   * @param input - The input
   */
  async execute(
    input: UnlinkOAuthProviderInput,
  ): Promise<UnlinkOAuthProviderOutput> {
    // Find credentials for this account and provider
    const credentials = await this.#oauthStore.findAllByAccountId(
      input.accountId,
    );
    const credential = credentials.find(
      (c) => c.proof.provider === input.provider,
    );

    if (!credential) {
      throw new OAuthProviderNotFoundError(input.provider);
    }

    await this.#oauthStore.delete(credential.id);

    return { success: true };
  }
}
