import {
  AccountId,
  InvalidReceiptError,
  Receipt,
  type ReceiptSigner,
  type ReceiptVerifier,
} from "@odysseon/whoami-core";
import { jwtVerify, SignJWT, errors } from "jose";

const RECEIPT_KIND_CLAIM = "whoami_kind";
const RECEIPT_KIND_VALUE = "receipt";

type JoseReceiptPayload = {
  sub: string;
  exp: number;
  [RECEIPT_KIND_CLAIM]: typeof RECEIPT_KIND_VALUE;
};

/**
 * Configuration for `JoseReceiptCodec`.
 */
export interface JoseReceiptCodecConfig {
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
  audience?: string;
}

/**
 * JOSE-backed receipt signer and verifier.
 */
export class JoseReceiptCodec implements ReceiptSigner, ReceiptVerifier {
  private readonly encodedSecret: Uint8Array;

  constructor(private readonly config: JoseReceiptCodecConfig) {
    if (!config.secret || config.secret.length < 32) {
      throw new Error(
        "JoseReceiptCodec requires a secret of at least 32 characters for adequate security.",
      );
    }

    this.encodedSecret = new TextEncoder().encode(config.secret);
  }

  /**
   * Signs a receipt token for the supplied account and expiry time.
   *
   * @param accountId - The authenticated account identifier.
   * @param expiresAt - The exact token expiry time.
   * @returns The signed receipt token.
   */
  public async sign(accountId: AccountId, expiresAt: Date): Promise<string> {
    const payload: JoseReceiptPayload = {
      sub: String(accountId.value),
      exp: Math.floor(expiresAt.getTime() / 1000),
      [RECEIPT_KIND_CLAIM]: RECEIPT_KIND_VALUE,
    };

    let jwt = new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(payload.sub)
      .setExpirationTime(expiresAt);

    if (this.config.issuer) {
      jwt = jwt.setIssuer(this.config.issuer);
    }

    if (this.config.audience) {
      jwt = jwt.setAudience(this.config.audience);
    }

    return await jwt.sign(this.encodedSecret);
  }

  /**
   * Verifies a signed receipt token and restores the receipt metadata.
   *
   * @param token - The signed receipt token.
   * @returns The verified receipt.
   * @throws {InvalidReceiptError} When the receipt token is malformed or invalid.
   */
  public async verify(token: string): Promise<Receipt> {
    try {
      const { payload } = await jwtVerify(token, this.encodedSecret, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      });

      if (
        payload[RECEIPT_KIND_CLAIM] !== RECEIPT_KIND_VALUE ||
        typeof payload.sub !== "string" ||
        typeof payload.exp !== "number"
      ) {
        throw new InvalidReceiptError("The receipt token is malformed.");
      }

      return Receipt.issue(
        token,
        new AccountId(payload.sub),
        new Date(payload.exp * 1000),
      );
    } catch (error) {
      if (error instanceof InvalidReceiptError) {
        throw error;
      }

      if (
        error instanceof errors.JWTExpired ||
        error instanceof errors.JWTInvalid ||
        error instanceof errors.JWSInvalid ||
        error instanceof errors.JWSSignatureVerificationFailed ||
        error instanceof errors.JWTClaimValidationFailed
      ) {
        throw new InvalidReceiptError(
          "The receipt token is expired, malformed, or invalid.",
        );
      }

      throw new InvalidReceiptError("Failed to verify receipt token.");
    }
  }
}
