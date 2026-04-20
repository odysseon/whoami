import type { CredentialProof } from "../../../kernel/domain/entities/credential.js";

/**
 * Password hash proof - for normal password authentication
 */
export interface PasswordHashProof extends CredentialProof {
  readonly kind: "password_hash";
  readonly hash: string;
}

/**
 * Password reset proof - for password recovery flow
 */
export interface PasswordResetProof extends CredentialProof {
  readonly kind: "password_reset";
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly usedAt?: Date;
}

/**
 * Union type for all password-related proofs
 */
export type PasswordProof = PasswordHashProof | PasswordResetProof;

/**
 * Type guard for PasswordHashProof
 */
export function isPasswordHashProof(
  proof: CredentialProof,
): proof is PasswordHashProof {
  return proof.kind === "password_hash";
}

/**
 * Type guard for PasswordResetProof
 */
export function isPasswordResetProof(
  proof: CredentialProof,
): proof is PasswordResetProof {
  return proof.kind === "password_reset";
}

/**
 * Creates a password hash proof
 */
export function createPasswordHashProof(hash: string): PasswordHashProof {
  return {
    kind: "password_hash",
    hash,
  };
}

/**
 * Creates a password reset proof
 */
export function createPasswordResetProof(
  tokenHash: string,
  expiresAt: Date,
): PasswordResetProof {
  return {
    kind: "password_reset",
    tokenHash,
    expiresAt,
  };
}

/**
 * Marks a password reset proof as used
 */
export function markResetProofAsUsed(
  proof: PasswordResetProof,
  usedAt: Date = new Date(),
): PasswordResetProof {
  return {
    ...proof,
    usedAt,
  };
}

/**
 * Checks if a password reset proof has expired
 */
export function isResetProofExpired(
  proof: PasswordResetProof,
  now: Date = new Date(),
): boolean {
  return now >= proof.expiresAt;
}

/**
 * Checks if a password reset proof has been used
 */
export function isResetProofUsed(proof: PasswordResetProof): boolean {
  return proof.usedAt !== undefined;
}
