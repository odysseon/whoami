import { jwtVerify } from "jose";
import type { ReceiptVerifier } from "@odysseon/whoami-core";
import {
  createAccountId,
  InvalidReceiptError,
  Receipt,
} from "@odysseon/whoami-core";
import {
  JoseReceiptConfig,
  RECEIPT_KIND_CLAIM,
  RECEIPT_KIND_VALUE,
  validateJoseError,
  createSecretKey,
} from "./jose-receipt.shared.js";

/**
 * JOSE (JSON Object Signing and Encryption) implementation of a receipt verifier.
 */
export class JoseReceiptVerifier implements ReceiptVerifier {
  private readonly encodedSecret: Uint8Array;

  constructor(private readonly config: JoseReceiptConfig) {
    this.encodedSecret = createSecretKey(config.secret);
  }

  /**
   * Verifies a receipt token and returns a validated Receipt object.
   */
  public async verify(token: string): Promise<Receipt> {
    try {
      // Build JWT verification options only with defined fields
      const options: Parameters<typeof jwtVerify>[2] = {};
      if (this.config.issuer) options.issuer = this.config.issuer;
      if (this.config.audience) options.audience = this.config.audience;

      const { payload } = await jwtVerify(token, this.encodedSecret, options);

      // Validate the receipt token structure
      if (
        payload[RECEIPT_KIND_CLAIM] !== RECEIPT_KIND_VALUE ||
        typeof payload.sub !== "string" ||
        typeof payload.exp !== "number"
      ) {
        throw new InvalidReceiptError("The receipt token is malformed.");
      }

      return Receipt.load({
        token,
        accountId: createAccountId(payload.sub),
        expiresAt: new Date(payload.exp * 1000),
      });
    } catch (error) {
      // Preserve InvalidReceiptError
      if (error instanceof InvalidReceiptError) throw error;

      // Handle JOSE-specific errors
      if (validateJoseError(error)) {
        throw new InvalidReceiptError();
      }

      // Fallback for unexpected errors
      throw new InvalidReceiptError("Failed to verify receipt token.");
    }
  }
}
