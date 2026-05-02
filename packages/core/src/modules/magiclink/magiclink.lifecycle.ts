import type { CredentialId } from "../../kernel/domain/value-objects/index.js";
import { createAccountId } from "../../kernel/domain/value-objects/index.js";
import type { MagicLinkTokenStore } from "./ports/magiclink-token-store.port.js";

export interface MagicLinkLifecycleDeps {
  readonly magicLinkStore: MagicLinkTokenStore;
}

export interface MagicLinkLifecycle {
  countCredentialsForAccount(accountId: string): Promise<number>;
  removeCredential(credentialId: CredentialId): Promise<void>;
  removeAllCredentialsForAccount(
    accountId: string,
    _options?: { provider?: string },
  ): Promise<void>;
}

export function buildMagicLinkLifecycle(
  deps: MagicLinkLifecycleDeps,
): MagicLinkLifecycle {
  const { magicLinkStore } = deps;

  return {
    async countCredentialsForAccount(accountId: string): Promise<number> {
      return await magicLinkStore.countForAccount(createAccountId(accountId));
    },

    async removeCredential(credentialId: CredentialId): Promise<void> {
      await magicLinkStore.delete(credentialId);
    },

    async removeAllCredentialsForAccount(
      accountId: string,
      _options?: { provider?: string },
    ): Promise<void> {
      await magicLinkStore.deleteAllForAccount(createAccountId(accountId));
    },
  };
}
