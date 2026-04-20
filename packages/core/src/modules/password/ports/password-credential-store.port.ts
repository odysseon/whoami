import type { Credential } from "../../../kernel/domain/entities/credential.js";
import type {
  AccountId,
  CredentialId,
} from "../../../kernel/domain/value-objects/index.js";
import type { PasswordProof } from "../entities/password.proof.js";

/**
 * Port for password credential persistence operations.
 * Implemented by infrastructure adapters (e.g., database repositories).
 */
export interface PasswordCredentialStore {
  /**
   * Finds a password credential by account ID
   * @param accountId - The account ID
   * @returns The credential if found, null otherwise
   */
  findByAccountId(
    accountId: AccountId,
  ): Promise<Credential<PasswordProof> | null>;

  /**
   * Finds a password credential by its ID
   * @param credentialId - The credential ID
   * @returns The credential if found, null otherwise
   */
  findById(
    credentialId: CredentialId,
  ): Promise<Credential<PasswordProof> | null>;

  /**
   * Finds a password reset credential by token hash
   * @param tokenHash - The SHA-256 hash of the token
   * @returns The credential if found, null otherwise
   */
  findByTokenHash(tokenHash: string): Promise<Credential<PasswordProof> | null>;

  /**
   * Saves a password credential
   * @param credential - The credential to save
   */
  save(credential: Credential<PasswordProof>): Promise<void>;

  /**
   * Updates a password credential's proof
   * @param credentialId - The credential ID
   * @param proof - The new proof
   */
  update(credentialId: CredentialId, proof: PasswordProof): Promise<void>;

  /**
   * Deletes a password credential
   * @param credentialId - The credential ID
   */
  delete(credentialId: CredentialId): Promise<void>;

  /**
   * Checks if a password credential exists for an account
   * @param accountId - The account ID
   * @returns True if a credential exists
   */
  existsForAccount(accountId: AccountId): Promise<boolean>;

  /**
   * Counts password credentials for an account
   * @param accountId - The account ID
   * @returns The number of credentials (0 or 1 for password)
   */
  countForAccount(accountId: AccountId): Promise<number>;

  /**
   * Deletes all password reset credentials for an account
   * @param accountId - The account ID
   */
  deleteAllResetCredentialsForAccount(accountId: AccountId): Promise<void>;

  /**
   * Deletes expired reset credentials
   * @param before - Delete credentials expired before this date
   */
  deleteExpiredResetCredentials(before: Date): Promise<void>;
}
