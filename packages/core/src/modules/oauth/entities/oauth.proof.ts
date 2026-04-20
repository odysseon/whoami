import type { CredentialProof } from "../../../kernel/domain/entities/credential.js";

/**
 * OAuth proof - stores the provider and provider-specific user ID
 */
export interface OAuthProof extends CredentialProof {
  readonly kind: "oauth";
  readonly provider: string;
  readonly providerId: string;
}

/**
 * Type guard for OAuthProof
 */
export function isOAuthProof(proof: CredentialProof): proof is OAuthProof {
  return proof.kind === "oauth";
}

/**
 * Creates an OAuth proof
 */
export function createOAuthProof(
  provider: string,
  providerId: string,
): OAuthProof {
  return {
    kind: "oauth",
    provider,
    providerId,
  };
}
