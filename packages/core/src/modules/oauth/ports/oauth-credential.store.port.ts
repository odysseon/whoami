import type { AccountId, CredentialId } from "../../../kernel/shared/index.js";
import type { Credential } from "../../../kernel/credential/index.js";

/**
 * Persistence port for OAuth credentials — owned by the oauth module.
 *
 * An account may have multiple OAuth credentials (one per provider).
 *
 * @remarks
 * No `update` method — OAuth credentials are immutable after creation.
 * To migrate a provider identity: delete old, save new.
 * @public
 */
export interface OAuthCredentialStore {
  findByProvider(
    provider: string,
    providerId: string,
  ): Promise<Credential | null>;
  findAllByAccountId(accountId: AccountId): Promise<Credential[]>;
  save(credential: Credential): Promise<void>;
  delete(credentialId: CredentialId): Promise<void>;
  deleteByProvider(accountId: AccountId, provider: string): Promise<void>;
  deleteAllForAccount(accountId: AccountId): Promise<void>;
  existsForAccount(accountId: AccountId): Promise<boolean>;
}
