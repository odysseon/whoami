import { InvalidConfigurationError } from "../../index.js";
import type { CredentialId } from "../domain/value-objects/index.js";
import type { CredentialStoreBase } from "../ports/credential-store.port.js";

/**
 * AuthLifecycle is the runtime interface that AuthOrchestrator calls.
 * Each module provides an instance via the generic builder.
 */
export interface AuthLifecycle {
  countCredentialsForAccount(accountId: string): Promise<number>;
  removeCredential(credentialId: CredentialId): Promise<void>;
  removeAllCredentialsForAccount(
    accountId: string,
    options?: { provider?: string },
  ): Promise<void>;
}

/**
 * Generic lifecycle builder.
 *
 * For stores that only support bulk deletion (password, magiclink),
 * pass the store directly. For stores with provider-level granularity (oauth),
 * pass an optional `deleteByProvider` callback.
 */
export function buildAuthLifecycle(
  store: CredentialStoreBase,
  options?: {
    deleteByProvider?: (accountId: string, provider: string) => Promise<void>;
  },
): AuthLifecycle {
  return {
    async countCredentialsForAccount(accountId: string): Promise<number> {
      return await store.countForAccount(accountId);
    },

    async removeCredential(credentialId: CredentialId): Promise<void> {
      await store.delete(credentialId);
    },

    async removeAllCredentialsForAccount(
      accountId: string,
      opts?: { provider?: string },
    ): Promise<void> {
      if (opts?.provider && options?.deleteByProvider) {
        await options.deleteByProvider(accountId, opts.provider);
      } else if (store.deleteAllForAccount) {
        await store.deleteAllForAccount(accountId);
      } else {
        throw new InvalidConfigurationError(
          `Store does not support deleteAllForAccount`,
        );
      }
    },
  };
}
