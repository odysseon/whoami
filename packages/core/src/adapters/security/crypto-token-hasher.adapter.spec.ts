import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { CryptoTokenHasher } from "./crypto-token-hasher.adapter.js";

describe("CryptoTokenHasher Adapter", () => {
  let hasher: CryptoTokenHasher;

  beforeEach(() => {
    hasher = new CryptoTokenHasher();
  });

  it("should successfully hash a token", async () => {
    const token = "my_secret_refresh_token_uuid";
    const hash = await hasher.hash(token);

    assert.ok(typeof hash === "string");
    assert.notEqual(hash, token);
    assert.equal(hash.length, 64); // SHA-256 hex strings are 64 characters long
  });

  it("should be deterministic (same input produces same output)", async () => {
    const token = "consistent_token_string";
    const hash1 = await hasher.hash(token);
    const hash2 = await hasher.hash(token);

    assert.equal(hash1, hash2);
  });

  it("should successfully verify a matching token and hash", async () => {
    const token = "another_secret_token";
    const hash = await hasher.hash(token);

    const isValid = await hasher.verify(hash, token);
    assert.equal(isValid, true);
  });

  it("should return false for a mismatched token", async () => {
    const token = "real_token";
    const hash = await hasher.hash(token);

    const isValid = await hasher.verify(hash, "wrong_token");
    assert.equal(isValid, false);
  });

  it("should return false if the hash lengths do not match (timing attack defense)", async () => {
    const token = "real_token";
    const shortHash = "abc123"; // Way shorter than 64 chars

    const isValid = await hasher.verify(shortHash, token);
    assert.equal(isValid, false);
  });

  it("should handle empty strings gracefully", async () => {
    await assert.rejects(() => hasher.hash(""), /Cannot hash an empty token/);

    const isVerifyValid = await hasher.verify("", "some_token");
    assert.equal(isVerifyValid, false);
  });
});
