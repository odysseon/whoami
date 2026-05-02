import type { CredentialId } from "../../kernel/domain/value-objects/index.js";
import { createAccountId } from "../../kernel/domain/value-objects/index.js";
import type { OAuthCredentialStore } from "./ports/oauth-credential-store.port.js";

export interface OAuthLifecycleDeps {
  readonly oauthStore: OAuthCredentialStore;
}

export interface OAuthLifecycle {
  countCredentialsForAccount(accountId: string): Promise<number>;
  removeCredential(credentialId: CredentialId): Promise<void>;
  removeAllCredentialsForAccount(
    accountId: string,
    options?: { provider?: string },
  ): Promise<void>;
}

export function buildOAuthLifecycle(deps: OAuthLifecycleDeps): OAuthLifecycle {
  const { oauthStore } = deps;

  return {
    async countCredentialsForAccount(accountId: string): Promise<number> {
      return await oauthStore.countForAccount(createAccountId(accountId));
    },

    async removeCredential(credentialId: CredentialId): Promise<void> {
      await oauthStore.delete(credentialId);
    },

    async removeAllCredentialsForAccount(
      accountId: string,
      options?: { provider?: string },
    ): Promise<void> {
      if (options?.provider) {
        await oauthStore.deleteByProvider(
          createAccountId(accountId),
          options.provider,
        );
      } else {
        await oauthStore.deleteAllForAccount(createAccountId(accountId));
      }
    },
  };
}
