import { AccountId } from "../../../../shared/domain/value-objects/account-id.vo.js";
import { CredentialId } from "../../../../shared/index.js";
import { Credential } from "../credential.entity.js";

/**
 * Stores OAuth credentials.
 *
 * Implement this interface if your application supports OAuth authentication.
 * An account can have multiple OAuth credentials (one per provider).
 */
export interface OAuthCredentialStore {
  /**
   * Finds an OAuth credential by provider and provider-specific user identifier.
   *
   * @param provider - The OAuth provider name (e.g., "google", "github").
   * @param providerId - The user identifier returned by the provider.
   * @returns The matching credential, or `null` if none exists.
   */
  findByProvider(
    provider: string,
    providerId: string,
  ): Promise<Credential | null>;

  /**
   * Persists an OAuth credential.
   *
   * @param credential - The credential to store.
   */
  save(credential: Credential): Promise<void>;

  /**
   * Removes an OAuth credential.
   *
   * @param credentialId - The identifier of the credential to remove.
   */
  delete(credentialId: CredentialId): Promise<void>;

  /**
   * Retrieves all OAuth credentials belonging to an account.
   *
   * @param accountId - The account identifier.
   * @returns An array of OAuth credentials associated with the account.
   */
  findAllByAccountId(accountId: AccountId): Promise<Credential[]>;
  deleteAllForAccount(accountId: AccountId): Promise<void>;

  deleteByProvider(accountId: AccountId, provider: string): Promise<void>;

  existsForAccount(accountId: AccountId): Promise<boolean>;
}
