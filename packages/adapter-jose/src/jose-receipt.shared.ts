import { errors } from "jose";

export const RECEIPT_KIND_CLAIM = "whoami_kind";
export const RECEIPT_KIND_VALUE = "receipt";

export interface JoseReceiptConfig {
  /**
   * The symmetric secret key for HS256. Must be at least 32 characters.
   */
  secret: string;

  /**
   * Optional issuer claim.
   */
  issuer?: string;

  /**
   * Optional audience claim.
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
