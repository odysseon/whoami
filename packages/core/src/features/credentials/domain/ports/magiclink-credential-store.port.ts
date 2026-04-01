import { CredentialId, EmailAddress } from "../../../../shared/index.js";
import { Credential } from "../credential.entity.js";

/**
 * Stores magic link credentials.
 *
 * Implement this interface if your application supports magic link authentication.
 * Magic links are one-time use credentials that should be deleted after verification.
 */
export interface MagicLinkCredentialStore {
  /**
   * Finds a magic link credential by email address.
   *
   * @param email - The normalized email address.
   * @returns The magic link credential, or `null` if none exists.
   */
  findByEmail(email: EmailAddress): Promise<Credential | null>;

  /**
   * Persists a magic link credential.
   *
   * @param credential - The credential to store.
   */
  save(credential: Credential): Promise<void>;

  /**
   * Removes a magic link credential.
   *
   * @param credentialId - The identifier of the credential to remove.
   */
  delete(credentialId: CredentialId): Promise<void>;

  /**
   * Removes all magic link credentials for a given email address.
   *
   * Used to invalidate old magic links when a new one is requested.
   *
   * @param email - The normalized email address whose magic link credentials
   *                should be removed.
   */
  deleteByEmail(email: EmailAddress): Promise<void>;
}
