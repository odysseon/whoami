import type { Credential } from "../../../kernel/domain/entities/credential.js";
import type {
  AccountId,
  CredentialId,
} from "../../../kernel/domain/value-objects/index.js";
import type { PasswordResetProof } from "../entities/password.proof.js";

/**
 * Port for password reset token persistence.
 *
 * Invariant: MANY records per accountId are allowed (one per reset request).
 * Adapters MUST NOT add a unique constraint on accountId.
 * Tokens are short-lived, single-use, and should be purged after use or expiry.
 *
 * This store knows nothing about password hashes — see PasswordHashStore.
 */
export interface PasswordResetTokenStore {
  /**
   * Looks up a reset token by its stored hash (SHA-256 of the plaintext token).
   */
  findByTokenHash(
    tokenHash: string,
  ): Promise<Credential<PasswordResetProof> | null>;

  /**
   * Inserts a new reset token credential.
   * Multiple tokens for the same accountId are valid.
   */
  save(credential: Credential<PasswordResetProof>): Promise<void>;

  /**
   * Marks a token as used by updating its proof (sets usedAt).
   */
  update(credentialId: CredentialId, proof: PasswordResetProof): Promise<void>;

  /**
   * Deletes all reset tokens for an account (e.g. on explicit revocation).
   */
  deleteAllForAccount(accountId: AccountId): Promise<void>;

  /**
   * Deletes all reset tokens that expired before the given date.
   * Should be called periodically for housekeeping.
   */
  deleteExpiredBefore(before: Date): Promise<void>;
}
