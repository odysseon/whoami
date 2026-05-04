import type { CredentialProof } from "../../../kernel/domain/entities/credential.js";

export interface PasswordResetProof extends CredentialProof {
  readonly kind: "password_reset";
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly usedAt?: Date;
}

export function createPasswordResetProof(
  tokenHash: string,
  expiresAt: Date,
): PasswordResetProof {
  return { kind: "password_reset", tokenHash, expiresAt };
}

export function markResetProofAsUsed(
  proof: PasswordResetProof,
  usedAt: Date = new Date(),
): PasswordResetProof {
  return { ...proof, usedAt };
}
