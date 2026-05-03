import type { CredentialId } from "../domain/value-objects/index.js";

/**
 * Minimal contract shared by all credential stores.
 * Enables a generic lifecycle builder — no per-module duplication.
 */
export interface CredentialStoreBase {
  countForAccount(accountId: string): Promise<number>;
  delete(credentialId: CredentialId): Promise<void>;
  deleteAllForAccount(accountId: string): Promise<void>;
}
