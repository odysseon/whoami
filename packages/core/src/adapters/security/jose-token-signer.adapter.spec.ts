import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { SignJWT } from "jose";
import { JoseTokenSigner } from "./jose-token-signer.adapter.js";
import { WhoamiError } from "../../errors/whoami-error.js";

describe("JoseTokenSigner Adapter", () => {
  const validSecret = "super_secret_key_that_is_at_least_32_chars_long!!";
  let signer: JoseTokenSigner;

  beforeEach(() => {
    signer = new JoseTokenSigner({
      secret: validSecret,
      issuer: "odysseon-auth",
      audience: "odysseon-users",
    });
  });

  it("should throw an error if initialized with a weak secret", () => {
    assert.throws(() => new JoseTokenSigner({ secret: "too_short" }), Error);
  });

  it("should successfully sign and verify a valid payload", async () => {
    const payload = { sub: "user_123", role: "admin" };

    // Sign for 1 hour
    const token = await signer.sign(payload, 3600);

    assert.ok(typeof token === "string");
    assert.equal(token.split(".").length, 3); // JWTs have 3 parts

    // Verify it
    const verified = await signer.verify(token);
    assert.equal(verified.sub, "user_123");
    assert.equal(verified["role"], "admin"); // Checking custom claim
    assert.equal(verified.iss, "odysseon-auth"); // Checking config injection
    assert.equal(verified.aud, "odysseon-users");
  });

  it("should throw TOKEN_EXPIRED for expired tokens", async () => {
    // Pass -1 second so it expires immediately upon creation
    const token = await signer.sign({ sub: "user_123" }, -1);

    await assert.rejects(
      () => signer.verify(token),
      (err: unknown) => {
        assert.ok(err instanceof WhoamiError);
        assert.equal(err.code, "TOKEN_EXPIRED");
        return true;
      },
    );
  });

  it("should throw TOKEN_MALFORMED if the token signature is tampered with", async () => {
    const token = await signer.sign({ sub: "user_123" }, 3600);

    // Tamper with the cryptographic signature (the last part of the JWT)
    const tamperedToken = token.substring(0, token.length - 5) + "xxxxx";

    await assert.rejects(
      () => signer.verify(tamperedToken),
      (err: unknown) => {
        assert.ok(err instanceof WhoamiError);
        assert.equal(err.code, "TOKEN_MALFORMED");
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
    // Craft a raw token bypassing our strict 'sign' method type checks
    const badPayload = { role: "admin" }; // Notice 'sub' is missing
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
});
