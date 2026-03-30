import { EmailAddress } from "../../../../shared/domain/value-objects/index.js";
import { Credential } from "../credential.entity.js";

/**
 * Retrieves and persists credentials associated with accounts.
 */
export interface CredentialStore {
  /**
   * Finds a credential by email address.
   *
   * @param email - The normalized email address.
   * @returns The matching credential, or `null` when no credential exists.
   */
  findByEmail(email: EmailAddress): Promise<Credential | null>;

  /**
   * Persists a credential.
   *
   * @param credential - The credential to store.
   */
  save(credential: Credential): Promise<void>;

  /**
   * Removes the credential associated with the given email address.
   *
   * Used to enforce one-time use semantics — magic-link credentials are deleted
   * immediately after successful verification so they cannot be replayed.
   *
   * @param email - The normalized email address whose credential should be removed.
   */
  deleteByEmail(email: EmailAddress): Promise<void>;
}
