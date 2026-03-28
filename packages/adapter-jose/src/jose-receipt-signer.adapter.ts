import { SignJWT } from "jose";
import type { ReceiptSigner, AccountId } from "@odysseon/whoami-core";
import {
  JoseReceiptConfig,
  RECEIPT_KIND_CLAIM,
  RECEIPT_KIND_VALUE,
  createSecretKey,
} from "./jose-receipt.shared.js";

/**
 * JOSE (JSON Object Signing and Encryption) implementation of a receipt signer.
 * Creates signed receipt tokens using the JOSE library with HS256 (HMAC SHA-256) algorithm.
 *
 * This signer generates JWT tokens that can be later verified by the corresponding
 * JOSE receipt verifier.
 */
export class JoseReceiptSigner implements ReceiptSigner {
  private readonly encodedSecret: Uint8Array;

  /**
   * Creates an instance of JoseReceiptSigner.
   *
   * @param config - Configuration object containing secret key, issuer, and audience
   */
  constructor(private readonly config: JoseReceiptConfig) {
    this.encodedSecret = createSecretKey(config.secret);
  }

  /**
   * Signs a receipt for the given account ID with the specified expiration time.
   *
   * The generated JWT includes:
   * - A custom claim identifying it as a receipt token
   * - The account ID as the subject (`sub`) claim
   * - The expiration time as the `exp` claim
   * - Optional issuer (`iss`) and audience (`aud`) claims if configured
   * - HS256 algorithm with JWT type header
   *
   * @param accountId - The account ID to include in the receipt
   * @param expiresAt - The expiration date and time for the receipt
   * @returns A promise that resolves to the signed JWT token string
   *
   * @remarks
   * Only custom claims go in the base payload. Standard claims like `sub` and `exp`
   * are handled by the chain methods to ensure proper JWT structure and validation.
   */
  public async sign(accountId: AccountId, expiresAt: Date): Promise<string> {
    // Set the custom receipt kind claim in the payload
    const payload = {
      [RECEIPT_KIND_CLAIM]: RECEIPT_KIND_VALUE,
    };

    // Build the JWT with standard claims
    let jwt = new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(String(accountId.value))
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000));

    // Add optional issuer if configured
    if (this.config.issuer) {
      jwt = jwt.setIssuer(this.config.issuer);
    }

    // Add optional audience if configured
    if (this.config.audience) {
      jwt = jwt.setAudience(this.config.audience);
    }

    // Sign the JWT with the secret key
    return await jwt.sign(this.encodedSecret);
  }
}
