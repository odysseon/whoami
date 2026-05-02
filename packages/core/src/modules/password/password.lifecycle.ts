import type { CredentialId } from "../../kernel/domain/value-objects/index.js";
import { createAccountId } from "../../kernel/domain/value-objects/index.js";
import type { PasswordHashStore } from "./ports/password-hash-store.port.js";

export interface PasswordLifecycleDeps {
  readonly passwordHashStore: PasswordHashStore;
}

export interface PasswordLifecycle {
  countCredentialsForAccount(accountId: string): Promise<number>;
  removeCredential(credentialId: CredentialId): Promise<void>;
  removeAllCredentialsForAccount(
    accountId: string,
    _options?: { provider?: string },
  ): Promise<void>;
}

export function buildPasswordLifecycle(
  deps: PasswordLifecycleDeps,
): PasswordLifecycle {
  const { passwordHashStore } = deps;

  return {
    async countCredentialsForAccount(accountId: string): Promise<number> {
      return await passwordHashStore.countForAccount(
        createAccountId(accountId),
      );
    },

    async removeCredential(credentialId: CredentialId): Promise<void> {
      await passwordHashStore.delete(credentialId);
    },

    async removeAllCredentialsForAccount(
      accountId: string,
      _options?: { provider?: string },
    ): Promise<void> {
      const credential = await passwordHashStore.findByAccountId(
        createAccountId(accountId),
      );
      if (credential) {
        await passwordHashStore.delete(credential.id);
      }
    },
  };
}
