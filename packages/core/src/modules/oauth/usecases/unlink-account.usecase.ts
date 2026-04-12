import {
  OAuthProviderNotFoundError,
  CannotRemoveLastCredentialError,
} from "../../../kernel/shared/index.js";
import type { AccountId } from "../../../kernel/shared/index.js";
import type { OAuthCredentialStore } from "../ports/oauth-credential.store.port.js";
import type { PasswordCredentialStore } from "../../password/ports/password-credential.store.port.js";

export interface UnlinkOAuthDeps {
  oauthStore: Pick<
    OAuthCredentialStore,
    "findAllByAccountId" | "deleteByProvider" | "existsForAccount"
  >;
  passwordStore?: Pick<PasswordCredentialStore, "existsForAccount">;
}

export interface UnlinkOAuthInput {
  accountId: AccountId;
  provider: string;
}

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

    const remainingOAuth = allOAuth.length - 1;
    const hasPassword = this.deps.passwordStore
      ? await this.deps.passwordStore.existsForAccount(input.accountId)
      : false;

    if (remainingOAuth === 0 && !hasPassword)
      throw new CannotRemoveLastCredentialError();

    await this.deps.oauthStore.deleteByProvider(
      input.accountId,
      input.provider,
    );
  }
}
