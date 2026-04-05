import { AccountId } from "../../../../shared/domain/value-objects/account-id.vo.js";
import { CredentialId } from "../../../../shared/domain/value-objects/credential-id.vo.js";
import { Credential } from "../credential.entity.js";

/**
 * Persistence port for OAuth credentials.
 *
 * Implement this interface in your infrastructure layer to plug in any storage
 * backend.  An account may have multiple OAuth credentials — one per provider.
 *
 * @public
 */
export interface OAuthCredentialStore {
  /**
   * Finds an OAuth credential by provider name and provider-specific user ID.
   *
   * @param provider   - The OAuth provider name (e.g. `"google"`, `"github"`).
   * @param providerId - The user identifier returned by the provider (`sub` claim).
   * @returns The matching credential, or `null` when none exists.
   */
  findByProvider(
    provider: string,
    providerId: string,
  ): Promise<Credential | null>;

  /**
   * Retrieves all OAuth credentials belonging to an account.
   *
   * @param accountId - The {@link AccountId} to query.
   * @returns All OAuth credentials for the account (may be empty).
   */
  findAllByAccountId(accountId: AccountId): Promise<Credential[]>;

  /**
   * Persists an OAuth credential.
   *
   * @param credential - The credential to store.
   */
  save(credential: Credential): Promise<void>;

  /**
   * Removes a single OAuth credential by its own identifier.
   *
   * @param credentialId - The {@link CredentialId} of the credential to remove.
   */
  delete(credentialId: CredentialId): Promise<void>;

  /**
   * Removes the OAuth credential for a specific provider linked to an account.
   *
   * @param accountId - The account the credential belongs to.
   * @param provider  - The provider name to unlink (e.g. `"google"`).
   */
  deleteByProvider(accountId: AccountId, provider: string): Promise<void>;

  /**
   * Removes all OAuth credentials belonging to an account.
   *
   * @param accountId - The {@link AccountId} whose OAuth credentials should all be removed.
   */
  deleteAllForAccount(accountId: AccountId): Promise<void>;

  /**
   * Returns `true` when at least one OAuth credential exists for the given account.
   *
   * @param accountId - The {@link AccountId} to query.
   */
  existsForAccount(accountId: AccountId): Promise<boolean>;
}
