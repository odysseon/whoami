import type { Credential } from "../../../kernel/domain/entities/credential.js";
import type {
  AccountId,
  CredentialId,
} from "../../../kernel/domain/value-objects/index.js";
import type { OAuthProof } from "../entities/oauth.proof.js";

/**
 * Port for OAuth credential persistence operations.
 * Implemented by infrastructure adapters (e.g., database repositories).
 */
export interface OAuthCredentialStore {
  /**
   * Finds an OAuth credential by provider and provider ID
   * @param provider - The OAuth provider (e.g., 'google', 'github')
   * @param providerId - The provider-specific user ID
   * @returns The credential if found, null otherwise
   */
  findByProvider(
    provider: string,
    providerId: string,
  ): Promise<Credential<OAuthProof> | null>;

  /**
   * Finds all OAuth credentials for an account
   * @param accountId - The account ID
   * @returns Array of credentials
   */
  findAllByAccountId(accountId: AccountId): Promise<Credential<OAuthProof>[]>;

  /**
   * Saves an OAuth credential
   * @param credential - The credential to save
   */
  save(credential: Credential<OAuthProof>): Promise<void>;

  /**
   * Deletes an OAuth credential
   * @param credentialId - The credential ID
   */
  delete(credentialId: CredentialId): Promise<void>;

  /**
   * Deletes OAuth credentials by provider for an account
   * @param accountId - The account ID
   * @param provider - The OAuth provider
   */
  deleteByProvider(accountId: AccountId, provider: string): Promise<void>;

  /**
   * Deletes all OAuth credentials for an account
   * @param accountId - The account ID
   */
  deleteAllForAccount(accountId: AccountId): Promise<void>;

  /**
   * Checks if an OAuth credential exists for an account
   * @param accountId - The account ID
   * @returns True if a credential exists
   */
  existsForAccount(accountId: AccountId): Promise<boolean>;

  /**
   * Counts OAuth credentials for an account
   * @param accountId - The account ID
   * @returns The number of credentials
   */
  countForAccount(accountId: AccountId): Promise<number>;
}
