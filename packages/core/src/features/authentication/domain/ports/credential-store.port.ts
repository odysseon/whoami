import { EmailAddress } from "../../../../shared/domain/value-objects/index.js";
import { Credential } from "../credential.entity.js";

/**
 * Retrieves credentials associated with accounts.
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
   * Finds a credential by email address.
   *
   * @param credential - The new credentials.
   * @returns Nothing.
   */
  save(credential: Credential): Promise<void>;
}
