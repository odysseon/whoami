import { errors } from "jose";

export const RECEIPT_KIND_CLAIM = "whoami_kind";
export const RECEIPT_KIND_VALUE = "receipt";

/**
 * Configuration for JOSE-based receipt signer and verifier.
 *
 * Both adapters use **HS256** (HMAC-SHA256) — a symmetric algorithm.
 * The same `secret` must be used for both signing and verification.
 * This is appropriate for single-service deployments where the secret
 * never leaves the server.
 *
 * For asymmetric signing (RS256/ES256) implement {@link ReceiptSigner} and
 * {@link ReceiptVerifier} directly using the `jose` library's `SignJWT` /
 * `jwtVerify` with a `KeyLike` rather than a shared secret.
 */
export interface JoseReceiptConfig {
  /**
   * The symmetric secret key for HS256.
   * Must be at least 32 characters to provide adequate security.
   */
  secret: string;

  /**
   * Optional issuer claim (`iss`).
   */
  issuer?: string;

  /**
   * Optional audience claim (`aud`).
   */
  audience?: string | string[];
}

export type JoseReceiptPayload = {
  sub: string;
  exp: number;
  [RECEIPT_KIND_CLAIM]: typeof RECEIPT_KIND_VALUE;
};

export function validateJoseError(error: unknown): boolean {
  return (
    error instanceof errors.JWTExpired ||
    error instanceof errors.JWTInvalid ||
    error instanceof errors.JWSInvalid ||
    error instanceof errors.JWSSignatureVerificationFailed ||
    error instanceof errors.JWTClaimValidationFailed
  );
}

export function createSecretKey(secret: string): Uint8Array {
  if (!secret || secret.length < 32) {
    throw new Error(
      "JoseReceipt requires a secret of at least 32 characters for adequate security.",
    );
  }
  return new TextEncoder().encode(secret);
}
