import { OAuthProviderNotFoundError } from "../../../kernel/shared/index.js";
import type { AccountId } from "../../../kernel/shared/index.js";
import type { OAuthCredentialStore } from "../ports/oauth-credential.store.port.js";

export interface UnlinkOAuthDeps {
  oauthStore: Pick<
    OAuthCredentialStore,
    "findAllByAccountId" | "deleteByProvider"
  >;
}

export interface UnlinkOAuthInput {
  accountId: AccountId;
  provider: string;
}

/**
 * Unlinks a specific OAuth provider from an account.
 * Does NOT enforce the last-credential invariant — that is the kernel's responsibility.
 */
export class UnlinkOAuthUseCase {
  private readonly deps: UnlinkOAuthDeps;

  constructor(deps: UnlinkOAuthDeps) {
    this.deps = deps;
  }

  async execute(input: UnlinkOAuthInput): Promise<void> {
    const allOAuth = await this.deps.oauthStore.findAllByAccountId(
      input.accountId,
    );
    const target = allOAuth.find((c) => c.oauthProvider === input.provider);
    if (!target) throw new OAuthProviderNotFoundError(input.provider);

    await this.deps.oauthStore.deleteByProvider(
      input.accountId,
      input.provider,
    );
  }
}
