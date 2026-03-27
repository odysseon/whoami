import { WhoamiError } from "@odysseon/whoami-core";
import type { IJwtPayload, ITokenSigner } from "@odysseon/whoami-core";
import { SignJWT, jwtVerify, errors, type JWTPayload } from "jose";

const SUBJECT_TYPE_CLAIM = "whoami_sub_type";

type JwtSubjectType = "string" | "number";

type WhoamiJwtPayload = JWTPayload & {
  [SUBJECT_TYPE_CLAIM]?: JwtSubjectType;
};

function normalizePayload(payload: IJwtPayload): WhoamiJwtPayload {
  if (typeof payload.sub === "string") {
    if (payload.sub.trim().length === 0) {
      throw new WhoamiError(
        "TOKEN_MALFORMED",
        "Token payload is missing a valid subject (sub) claim.",
      );
    }

    return {
      ...payload,
      sub: payload.sub,
      [SUBJECT_TYPE_CLAIM]: "string",
    };
  }

  if (typeof payload.sub === "number" && Number.isFinite(payload.sub)) {
    return {
      ...payload,
      sub: String(payload.sub),
      [SUBJECT_TYPE_CLAIM]: "number",
    };
  }

  throw new WhoamiError(
    "TOKEN_MALFORMED",
    "Token payload is missing a valid subject (sub) claim.",
  );
}

function restorePayload(payload: WhoamiJwtPayload): IJwtPayload {
  if (typeof payload.sub !== "string" || payload.sub.trim().length === 0) {
    throw new WhoamiError(
      "TOKEN_MALFORMED",
      "Token payload is missing a valid subject (sub) claim.",
    );
  }

  const subjectType = payload[SUBJECT_TYPE_CLAIM];

  if (subjectType === "number") {
    const numericSubject = Number(payload.sub);
    if (!Number.isFinite(numericSubject)) {
      throw new WhoamiError(
        "TOKEN_MALFORMED",
        "Token payload contains an invalid numeric subject (sub) claim.",
      );
    }

    return {
      ...payload,
      sub: numericSubject,
    };
  }

  if (subjectType !== undefined && subjectType !== "string") {
    throw new WhoamiError(
      "TOKEN_MALFORMED",
      "Token payload contains an invalid subject type marker.",
    );
  }

  return {
    ...payload,
    sub: payload.sub,
  };
}

export interface JoseSignerConfig {
  /** The symmetric secret key for HS256. Must be at least 32 characters. */
  secret: string;
  /** Optional: The issuer claim (iss) to append and verify. */
  issuer?: string;
  /** Optional: The audience claim (aud) to append and verify. */
  audience?: string;
}

export class JoseTokenSigner implements ITokenSigner {
  private readonly encodedSecret: Uint8Array;

  constructor(private readonly config: JoseSignerConfig) {
    if (!config.secret || config.secret.length < 32) {
      throw new Error(
        "JoseTokenSigner requires a secret of at least 32 characters for adequate security.",
      );
    }
    // Jose requires the secret to be a Uint8Array for symmetric algorithms
    this.encodedSecret = new TextEncoder().encode(config.secret);
  }

  public async sign(
    payload: IJwtPayload,
    expiresInSeconds: number,
  ): Promise<string> {
    let jwt = new SignJWT(normalizePayload(payload))
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime(`${expiresInSeconds}s`);

    if (this.config.issuer) {
      jwt = jwt.setIssuer(this.config.issuer);
    }
    if (this.config.audience) {
      jwt = jwt.setAudience(this.config.audience);
    }

    return await jwt.sign(this.encodedSecret);
  }

  public async verify(token: string): Promise<IJwtPayload> {
    try {
      const { payload } = await jwtVerify(token, this.encodedSecret, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      });
      return restorePayload(payload);
    } catch (error) {
      // If manual WhoamiError was thrown above, just bubble it up
      if (error instanceof WhoamiError) {
        throw error;
      }

      // -------------------------------------------------------------
      // The Translator Boundary: Map library errors to Domain errors
      // -------------------------------------------------------------
      if (error instanceof errors.JWTExpired) {
        throw new WhoamiError(
          "TOKEN_EXPIRED",
          "The provided access token has expired.",
        );
      }

      if (
        error instanceof errors.JWTInvalid ||
        error instanceof errors.JWSInvalid ||
        error instanceof errors.JWSSignatureVerificationFailed ||
        error instanceof errors.JWTClaimValidationFailed
      ) {
        throw new WhoamiError(
          "TOKEN_MALFORMED",
          "The provided token is malformed, tampered with, or invalid.",
        );
      }

      throw new WhoamiError("TOKEN_MALFORMED", "Failed to verify token.");
    }
  }
}
