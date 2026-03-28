import { jwtVerify } from "jose";
import type { ReceiptVerifier } from "@odysseon/whoami-core";
import { AccountId, InvalidReceiptError, Receipt } from "@odysseon/whoami-core";
import {
  JoseReceiptConfig,
  RECEIPT_KIND_CLAIM,
  RECEIPT_KIND_VALUE,
  validateJoseError,
  createSecretKey,
} from "./jose-receipt.shared.js";

/**
 * JOSE (JSON Object Signing and Encryption) implementation of a receipt verifier.
 * Verifies receipt tokens using the JOSE library with JWT validation.
 *
 * This verifier validates receipt tokens issued by the corresponding JOSE receipt issuer,
 * ensuring they contain the proper claims and are cryptographically valid.
 */
export class JoseReceiptVerifier implements ReceiptVerifier {
  private readonly encodedSecret: Uint8Array;

  /**
   * Creates an instance of JoseReceiptVerifier.
   *
   * @param config - Configuration object containing secret, issuer, and audience
   */
  constructor(private readonly config: JoseReceiptConfig) {
    this.encodedSecret = createSecretKey(config.secret);
  }

  /**
   * Verifies a receipt token and returns a validated Receipt object.
   *
   * The verification process includes:
   * - Cryptographic signature validation
   * - Issuer and audience verification
   * - Claim structure validation (kind, subject, expiration)
   * - Token expiration checking
   *
   * @param token - The JWT receipt token to verify
   * @returns A promise that resolves to a validated Receipt instance
   * @throws {InvalidReceiptError} When the token is invalid, expired, malformed,
   *         or doesn't contain the required claims
   *
   * @remarks
   * This method loads an existing identity from the token rather than minting a new one.
   * The receipt is considered valid only if it contains the correct receipt kind claim,
   * a subject (sub) claim representing the account ID, and an expiration (exp) claim.
   */
  public async verify(token: string): Promise<Receipt> {
    try {
      const { payload } = await jwtVerify(token, this.encodedSecret, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      });

      // Validate the receipt token structure
      if (
        payload[RECEIPT_KIND_CLAIM] !== RECEIPT_KIND_VALUE ||
        typeof payload.sub !== "string" ||
        typeof payload.exp !== "number"
      ) {
        throw new InvalidReceiptError("The receipt token is malformed.");
      }

      // Load the existing identity from the verified token
      return Receipt.loadExisting(
        token,
        new AccountId(payload.sub),
        new Date(payload.exp * 1000),
      );
    } catch (error) {
      // Re-throw InvalidReceiptError without wrapping
      if (error instanceof InvalidReceiptError) {
        throw error;
      }

      // Handle JOSE-specific errors (expired, invalid signature, etc.)
      if (validateJoseError(error)) {
        throw new InvalidReceiptError(
          "The receipt token is expired, malformed, or invalid.",
        );
      }

      // Handle any other unexpected errors
      throw new InvalidReceiptError("Failed to verify receipt token.");
    }
  }
}
