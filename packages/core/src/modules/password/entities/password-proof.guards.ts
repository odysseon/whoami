import type { CredentialProof } from "../../../kernel/domain/entities/credential.js";
import type { PasswordResetProof } from "./password-reset.proof.js";

export function isPasswordResetProof(
  proof: CredentialProof,
): proof is PasswordResetProof {
  return proof.kind === "password_reset";
}

export function isResetProofExpired(
  proof: PasswordResetProof,
  now: Date = new Date(),
): boolean {
  return now >= proof.expiresAt;
}

export function isResetProofUsed(proof: PasswordResetProof): boolean {
  return proof.usedAt !== undefined;
}
