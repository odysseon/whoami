import { CredentialId } from "../../../../shared/domain/value-objects/credential-id.vo.js";
import { EmailAddress } from "../../../../shared/domain/value-objects/email-address.vo.js";
import { Credential } from "../credential.entity.js";

/**
 * Persistence port for magic-link credentials.
 *
 * Implement this interface in your infrastructure layer to plug in any storage
 * backend.  Magic-link credentials are single-use and short-lived; delete them
 * immediately after successful verification.
 *
 * @public
 */
export interface MagicLinkCredentialStore {
  /**
   * Finds a magic-link credential by the recipient's email address.
   *
   * @param email - The normalized {@link EmailAddress} to look up.
   * @returns The magic-link credential, or `null` when none exists.
   */
  findByEmail(email: EmailAddress): Promise<Credential | null>;

  /**
   * Persists a magic-link credential.
   *
   * @param credential - The credential to store.
   */
  save(credential: Credential): Promise<void>;

  /**
   * Removes a magic-link credential by its own identifier.
   *
   * @param credentialId - The {@link CredentialId} of the credential to remove.
   */
  delete(credentialId: CredentialId): Promise<void>;

  /**
   * Removes all magic-link credentials for the given email address.
   *
   * Use this to invalidate any outstanding magic links when a new one is
   * requested, ensuring only the most recently issued link is valid.
   *
   * @param email - The normalized email address whose magic-link credentials should be removed.
   */
  deleteByEmail(email: EmailAddress): Promise<void>;
}
