import type { CredentialProof } from "../../../kernel/domain/entities/credential.js";

/**
 * MagicLink proof - stores the token hash and expiration
 */
export interface MagicLinkProof extends CredentialProof {
  readonly kind: "magiclink";
  readonly tokenHash: string;
  readonly email: string;
  readonly expiresAt: Date;
  readonly usedAt?: Date;
}

/**
 * Type guard for MagicLinkProof
 */
export function isMagicLinkProof(
  proof: CredentialProof,
): proof is MagicLinkProof {
  return proof.kind === "magiclink";
}

/**
 * Creates a MagicLink proof
 */
export function createMagicLinkProof(
  tokenHash: string,
  email: string,
  expiresAt: Date,
): MagicLinkProof {
  return {
    kind: "magiclink",
    tokenHash,
    email,
    expiresAt,
  };
}

/**
 * Marks a MagicLink proof as used
 */
export function markMagicLinkAsUsed(
  proof: MagicLinkProof,
  usedAt: Date = new Date(),
): MagicLinkProof {
  return {
    ...proof,
    usedAt,
  };
}

/**
 * Checks if a MagicLink proof has expired
 */
export function isMagicLinkExpired(
  proof: MagicLinkProof,
  now: Date = new Date(),
): boolean {
  return now >= proof.expiresAt;
}

/**
 * Checks if a MagicLink proof has been used
 */
export function isMagicLinkUsed(proof: MagicLinkProof): boolean {
  return proof.usedAt !== undefined;
}
