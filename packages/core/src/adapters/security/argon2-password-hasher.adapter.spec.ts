import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { Argon2PasswordHasher } from "./argon2-password-hasher.adapter.js";

describe("Argon2PasswordHasher Adapter", () => {
  let hasher: Argon2PasswordHasher;

  beforeEach(() => {
    hasher = new Argon2PasswordHasher();
  });

  it("should successfully hash a password", async () => {
    const password = "CorrectHorseBatteryStaple123!";
    const hash = await hasher.hash(password);

    assert.ok(typeof hash === "string");
    assert.ok(hash.startsWith("$argon2")); // Verifies the Argon2 string format
    assert.notEqual(hash, password);
  });

  it("should generate completely different hashes for the same password (salting works)", async () => {
    const password = "super_secret_password";
    const hash1 = await hasher.hash(password);
    const hash2 = await hasher.hash(password);

    // Because of dynamic salting, the hashes should never match
    assert.notEqual(hash1, hash2);
  });

  it("should successfully verify a matching password against its hash", async () => {
    const password = "another_secret_password";
    const hash = await hasher.hash(password);

    const isValid = await hasher.verify(hash, password);
    assert.equal(isValid, true);
  });

  it("should return false for an incorrect password", async () => {
    const password = "real_password";
    const hash = await hasher.hash(password);

    const isValid = await hasher.verify(hash, "wrong_password");
    assert.equal(isValid, false);
  });

  it("should return false if the provided hash string is malformed", async () => {
    const isValid = await hasher.verify(
      "not_a_real_argon_hash_string",
      "some_password",
    );
    assert.equal(isValid, false);
  });

  it("should handle empty strings gracefully", async () => {
    await assert.rejects(
      () => hasher.hash(""),
      /Cannot hash an empty password/,
    );

    const isVerifyValid = await hasher.verify("", "some_password");
    assert.equal(isVerifyValid, false);
  });
});
