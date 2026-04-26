import type { Credential } from "../../../kernel/domain/entities/credential.js";
import type {
  AccountId,
  CredentialId,
} from "../../../kernel/domain/value-objects/index.js";
import type { MagicLinkProof } from "../entities/magiclink.proof.js";

/**
 * Port for MagicLink credential persistence operations.
 * Implemented by infrastructure adapters (e.g., database repositories).
 */
export interface MagicLinkCredentialStore {
  /**
   * Finds a MagicLink credential by token hash
   * @param tokenHash - The SHA-256 hash of the token
   * @returns The credential if found, null otherwise
   */
  findByTokenHash(
    tokenHash: string,
  ): Promise<Credential<MagicLinkProof> | null>;

  /**
   * Finds all MagicLink credentials for an account
   * @param accountId - The account ID
   * @returns Array of credentials
   */
  findAllByAccountId(
    accountId: AccountId,
  ): Promise<Credential<MagicLinkProof>[]>;

  /**
   * Saves a MagicLink credential
   * @param credential - The credential to save
   */
  save(credential: Credential<MagicLinkProof>): Promise<void>;

  /**
   * Updates a MagicLink credential
   * @param credentialId - The credential ID
   * @param proof - The new proof
   */
  update(credentialId: CredentialId, proof: MagicLinkProof): Promise<void>;

  /**
   * Deletes a MagicLink credential
   * @param credentialId - The credential ID
   */
  delete(credentialId: CredentialId): Promise<void>;

  /**
   * Deletes all MagicLink credentials for an account
   * @param accountId - The account ID
   */
  deleteAllForAccount(accountId: AccountId): Promise<void>;

  /**
   * Counts MagicLink credentials for an account
   * @param accountId - The account ID
   * @returns The number of credentials
   */
  countForAccount(accountId: AccountId): Promise<number>;

  /**
   * Deletes expired MagicLink credentials
   * @param before - Delete credentials expired before this date
   */
  deleteExpired(before: Date): Promise<void>;
}
