import type { AccountId, CredentialId } from "../../../kernel/shared/index.js";
import type { Credential } from "../../../kernel/credential/index.js";

/**
 * Persistence port for password credentials — owned by the password module.
 *
 * Each account may have at most one password credential.
 * @public
 */
export interface PasswordCredentialStore {
  findByAccountId(accountId: AccountId): Promise<Credential | null>;
  save(credential: Credential): Promise<void>;
  update(credentialId: CredentialId, newHash: string): Promise<void>;
  delete(credentialId: CredentialId): Promise<void>;
  existsForAccount(accountId: AccountId): Promise<boolean>;
}
