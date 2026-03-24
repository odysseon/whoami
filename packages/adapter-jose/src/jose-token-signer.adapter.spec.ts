import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { SignJWT } from "jose";
import { JoseTokenSigner } from "./jose-token-signer.adapter.js";
import { WhoamiError } from "@odysseon/whoami-core";

describe("JoseTokenSigner Adapter", () => {
  const validSecret = "super_secret_key_that_is_at_least_32_chars_long!!";
  let signer: JoseTokenSigner;

  describe("Constructor", () => {
    it("should create instance with valid secret", () => {
      const signer = new JoseTokenSigner({ secret: validSecret });
      assert.ok(signer instanceof JoseTokenSigner);
    });

    it("should throw an error if initialized with a weak secret (< 32 chars)", () => {
      assert.throws(
        () => new JoseTokenSigner({ secret: "too_short" }),
        Error,
        "JoseTokenSigner requires a secret of at least 32 characters for adequate security.",
      );
    });

    it("should throw an error if initialized with empty secret", () => {
      assert.throws(
        () => new JoseTokenSigner({ secret: "" }),
        Error,
        "JoseTokenSigner requires a secret of at least 32 characters for adequate security.",
      );
    });
  });

  describe("Sign method", () => {
    beforeEach(() => {
      signer = new JoseTokenSigner({
        secret: validSecret,
        issuer: "odysseon-auth",
        audience: "odysseon-users",
      });
    });

    it("should successfully sign a valid payload", async () => {
      const payload = { sub: "user_123", role: "admin" };
      const token = await signer.sign(payload, 3600);

      assert.ok(typeof token === "string");
      assert.equal(token.split(".").length, 3);
    });

    it("should include issuer in token when configured", async () => {
      const payload = { sub: "user_123" };
      const token = await signer.sign(payload, 3600);

      const verified = await signer.verify(token);
      assert.equal(verified.iss, "odysseon-auth");
    });

    it("should include audience in token when configured", async () => {
      const payload = { sub: "user_123" };
      const token = await signer.sign(payload, 3600);

      const verified = await signer.verify(token);
      assert.equal(verified.aud, "odysseon-users");
    });

    it("should NOT include issuer if not configured", async () => {
      const signerWithoutIssuer = new JoseTokenSigner({ secret: validSecret });
      const payload = { sub: "user_123" };
      const token = await signerWithoutIssuer.sign(payload, 3600);

      const verified = await signerWithoutIssuer.verify(token);
      assert.equal(verified.iss, undefined);
    });

    it("should NOT include audience if not configured", async () => {
      const signerWithoutAudience = new JoseTokenSigner({
        secret: validSecret,
      });
      const payload = { sub: "user_123" };
      const token = await signerWithoutAudience.sign(payload, 3600);

      const verified = await signerWithoutAudience.verify(token);
      assert.equal(verified.aud, undefined);
    });
  });

  describe("Verify method", () => {
    beforeEach(() => {
      signer = new JoseTokenSigner({
        secret: validSecret,
        issuer: "odysseon-auth",
        audience: "odysseon-users",
      });
    });

    it("should successfully verify a valid token", async () => {
      const payload = { sub: "user_123", role: "admin" };
      const token = await signer.sign(payload, 3600);

      const verified = await signer.verify(token);
      assert.equal(verified.sub, "user_123");
      assert.equal(verified["role"], "admin");
      assert.equal(verified.iss, "odysseon-auth");
      assert.equal(verified.aud, "odysseon-users");
      assert.ok(verified.iat);
      assert.ok(verified.exp);
    });

    it("should throw TOKEN_EXPIRED for expired tokens", async () => {
      const token = await signer.sign({ sub: "user_123" }, -1);

      await assert.rejects(
        () => signer.verify(token),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "TOKEN_EXPIRED");
          assert.equal(err.message, "The provided access token has expired.");
          return true;
        },
      );
    });

    it("should throw TOKEN_MALFORMED if the token signature is tampered with", async () => {
      const token = await signer.sign({ sub: "user_123" }, 3600);
      const tamperedToken = token.substring(0, token.length - 5) + "xxxxx";

      await assert.rejects(
        () => signer.verify(tamperedToken),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "TOKEN_MALFORMED");
          assert.equal(
            err.message,
            "The provided token is malformed, tampered with, or invalid.",
          );
          return true;
        },
      );
    });

    it("should throw TOKEN_MALFORMED for completely invalid strings", async () => {
      await assert.rejects(
        () => signer.verify("this.is.not_a_real_jwt"),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "TOKEN_MALFORMED");
          return true;
        },
      );
    });

    it("should throw TOKEN_MALFORMED if the payload is missing the sub claim", async () => {
      const badPayload = { role: "admin" };
      const token = await new SignJWT(badPayload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuer("odysseon-auth")
        .setAudience("odysseon-users")
        .sign(new TextEncoder().encode(validSecret));

      await assert.rejects(
        () => signer.verify(token),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "TOKEN_MALFORMED");
          assert.ok(err.message.includes("subject (sub) claim"));
          return true;
        },
      );
    });

    it("should throw TOKEN_MALFORMED if the sub claim is empty string", async () => {
      const badPayload = { sub: "" };
      const token = await new SignJWT(badPayload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuer("odysseon-auth")
        .setAudience("odysseon-users")
        .sign(new TextEncoder().encode(validSecret));

      await assert.rejects(
        () => signer.verify(token),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "TOKEN_MALFORMED");
          assert.ok(err.message.includes("subject (sub) claim"));
          return true;
        },
      );
    });

    it("should throw TOKEN_MALFORMED if the sub claim is only whitespace", async () => {
      const badPayload = { sub: "   " };
      const token = await new SignJWT(badPayload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuer("odysseon-auth")
        .setAudience("odysseon-users")
        .sign(new TextEncoder().encode(validSecret));

      await assert.rejects(
        () => signer.verify(token),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "TOKEN_MALFORMED");
          assert.ok(err.message.includes("subject (sub) claim"));
          return true;
        },
      );
    });

    it("should handle JWTInvalid error from jose", async () => {
      // Create a token that will trigger JWTInvalid
      const invalidToken = "invalid.jwt.format";

      await assert.rejects(
        () => signer.verify(invalidToken),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "TOKEN_MALFORMED");
          return true;
        },
      );
    });

    it("should handle JWSInvalid error from jose", async () => {
      // Create a token with invalid structure
      const invalidToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.payload";

      await assert.rejects(
        () => signer.verify(invalidToken),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "TOKEN_MALFORMED");
          return true;
        },
      );
    });

    it("should handle generic errors from jose", async () => {
      // We pass a number instead of a string to force the internal 'jose' library
      // to throw a native TypeError, triggering your adapter's generic fallback catch.
      await assert.rejects(
        () => signer.verify(12345 as unknown as string),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "TOKEN_MALFORMED");
          return true;
        },
      );
    });

    it("should handle JWTClaimValidationFailed error from jose", async () => {
      // Create a token with invalid issuer claim
      const token = await new SignJWT({ sub: "user_123" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuer("wrong-issuer")
        .setAudience("odysseon-users")
        .sign(new TextEncoder().encode(validSecret));

      await assert.rejects(
        () => signer.verify(token),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "TOKEN_MALFORMED");
          assert.equal(
            err.message,
            "The provided token is malformed, tampered with, or invalid.",
          );
          return true;
        },
      );
    });

    it("should handle JWSSignatureVerificationFailed error from jose", async () => {
      // Create a token with wrong signature
      const wrongSecret = "different_secret_that_is_also_32_chars_long!!!";
      const wrongSigner = new JoseTokenSigner({ secret: wrongSecret });
      const token = await wrongSigner.sign({ sub: "user_123" }, 3600);

      await assert.rejects(
        () => signer.verify(token),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "TOKEN_MALFORMED");
          return true;
        },
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle very long expiration times", async () => {
      const signer = new JoseTokenSigner({ secret: validSecret });
      const payload = { sub: "user_123" };
      const token = await signer.sign(payload, 31536000); // 1 year

      const verified = await signer.verify(token);
      assert.equal(verified.sub, "user_123");
      assert.ok(verified.exp);
    });

    it("should handle zero expiration time", async () => {
      const signer = new JoseTokenSigner({ secret: validSecret });
      const payload = { sub: "user_123" };
      const token = await signer.sign(payload, 0);

      // Token with 0 expiration should be immediately expired
      await assert.rejects(
        () => signer.verify(token),
        (err: unknown) => {
          assert.ok(err instanceof WhoamiError);
          assert.equal(err.code, "TOKEN_EXPIRED");
          return true;
        },
      );
    });

    it("should handle payload with additional custom claims", async () => {
      const signer = new JoseTokenSigner({ secret: validSecret });
      const payload = {
        sub: "user_123",
        email: "user@example.com",
        permissions: ["read", "write"],
        metadata: { version: 1 },
      };
      const token = await signer.sign(payload, 3600);

      const verified = await signer.verify(token);
      assert.equal(verified.sub, "user_123");
      assert.equal(verified["email"], "user@example.com");
      assert.deepEqual(verified["permissions"], ["read", "write"]);
      assert.deepEqual(verified["metadata"], { version: 1 });
    });
  });
});
