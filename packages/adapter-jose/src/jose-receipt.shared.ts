import { errors } from "jose";

export { createSecretKey } from "./create-secret-key.js";

export const RECEIPT_KIND_CLAIM = "whoami_kind";
export const RECEIPT_KIND_VALUE = "receipt";

export interface JoseReceiptConfig {
  secret: string;
  issuer?: string;
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
