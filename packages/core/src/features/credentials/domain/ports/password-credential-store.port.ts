import { CredentialId } from "../../../../shared/domain/value-objects/credential-id.vo.js";
import { EmailAddress } from "../../../../shared/domain/value-objects/email-address.vo.js";
import { AccountId } from "../../../../shared/domain/value-objects/account-id.vo.js";
import { Credential } from "../credential.entity.js";

/**
 * Persistence port for password credentials.
 *
 * Implement this interface in your infrastructure layer to plug in any storage
 * backend.  Each account may have at most one password credential — enforce
 * this invariant in your implementation.
 *
 * @public
 */
export interface PasswordCredentialStore {
  /**
   * Finds a password credential by the account's email address.
   *
   * @param email - The normalized {@link EmailAddress} to look up.
   * @returns The password credential, or `null` when none exists.
   */
  findByEmail(email: EmailAddress): Promise<Credential | null>;

  /**
   * Finds a password credential by the account's identifier.
   *
   * @param accountId - The {@link AccountId} to look up.
   * @returns The password credential, or `null` when none exists.
   */
  findByAccountId(accountId: AccountId): Promise<Credential | null>;

  /**
   * Persists a password credential.
   *
   * The email address must be supplied so that implementations can maintain
   * the email → credential index required by {@link findByEmail}.
   *
   * @param credential - The credential to store.
   * @param email      - The account's email address (used to build the lookup index).
   */
  save(credential: Credential, email: EmailAddress): Promise<void>;

  /**
   * Updates the hash of an existing password credential.
   *
   * This method assumes the credential already exists; implementations should
   * throw an appropriate error if the credential is not found.
   *
   * @param credentialId - The ID of the credential to update.
   * @param newHash - The new hashed password string.
   */
  update(credentialId: CredentialId, newHash: string): Promise<void>;

  /**
   * Removes a password credential by its own identifier.
   *
   * @param credentialId - The {@link CredentialId} of the credential to remove.
   */
  delete(credentialId: CredentialId): Promise<void>;

  /**
   * Removes the password credential for the given account.
   *
   * Convenience alternative to `delete` when only the account ID is known.
   *
   * @param accountId - The {@link AccountId} whose password credential should be removed.
   */
  deleteByAccountId(accountId: AccountId): Promise<void>;

  /**
   * Returns `true` when a password credential exists for the given account.
   *
   * @param accountId - The {@link AccountId} to query.
   */
  existsForAccount(accountId: AccountId): Promise<boolean>;
}
