import type { Credential } from "../../../kernel/domain/entities/credential.js";
import type {
  AccountId,
  CredentialId,
} from "../../../kernel/domain/value-objects/index.js";
import type { PasswordHashProof } from "../entities/password.proof.js";

/**
 * Port for password hash persistence.
 *
 * Invariant: at most ONE record per accountId (upsert semantics).
 * Adapters MUST enforce a unique constraint on accountId.
 *
 * This store knows nothing about reset tokens — see PasswordResetTokenStore.
 */
export interface PasswordHashStore {
  /**
   * Finds the password hash credential for an account.
   */
  findByAccountId(
    accountId: AccountId,
  ): Promise<Credential<PasswordHashProof> | null>;

  /**
   * Finds a password hash credential by its credential ID.
   */
  findById(
    credentialId: CredentialId,
  ): Promise<Credential<PasswordHashProof> | null>;

  /**
   * Saves a new password hash credential.
   * Implementations MUST enforce one-per-account (upsert or unique constraint).
   */
  save(credential: Credential<PasswordHashProof>): Promise<void>;

  /**
   * Replaces the hash on an existing password credential.
   */
  update(credentialId: CredentialId, proof: PasswordHashProof): Promise<void>;

  /**
   * Deletes the password hash credential with the given ID.
   */
  delete(credentialId: CredentialId): Promise<void>;

  /**
   * Returns true if the account has a password hash credential.
   */
  existsForAccount(accountId: AccountId): Promise<boolean>;

  /**
   * Returns the count of password hash credentials for an account (0 or 1).
   */
  countForAccount(accountId: AccountId): Promise<number>;
}
