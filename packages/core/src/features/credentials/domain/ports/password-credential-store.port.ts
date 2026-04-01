import { CredentialId } from "../../../../shared/domain/value-objects/credential-id.vo.js";
import { EmailAddress } from "../../../../shared/domain/value-objects/email-address.vo.js";
import { Credential } from "../credential.entity.js";

/**
 * Stores password credentials.
 *
 * Implement this interface if your application supports password-based authentication.
 * Each account can have at most one password credential.
 */
export interface PasswordCredentialStore {
  /**
   * Finds a password credential by email address.
   *
   * @param email - The normalized email address.
   * @returns The password credential, or `null` if none exists.
   */
  findByEmail(email: EmailAddress): Promise<Credential | null>;

  /**
   * Persists a password credential.
   *
   * @param credential - The credential to store.
   */
  save(credential: Credential): Promise<void>;

  /**
   * Removes a password credential.
   *
   * @param credentialId - The identifier of the credential to remove.
   */
  delete(credentialId: CredentialId): Promise<void>;
}
