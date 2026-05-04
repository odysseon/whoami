import type { CredentialProof } from "../../../kernel/domain/entities/credential.js";

export interface PasswordHashProof extends CredentialProof {
  readonly kind: "password_hash";
  readonly hash: string;
}

export function createPasswordHashProof(hash: string): PasswordHashProof {
  return { kind: "password_hash", hash };
}

export function isPasswordHashProof(
  proof: CredentialProof,
): proof is PasswordHashProof {
  return proof.kind === "password_hash";
}
