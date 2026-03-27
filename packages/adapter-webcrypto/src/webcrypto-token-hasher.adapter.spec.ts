import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { WebCryptoTokenHasher } from "./webcrypto-token-hasher.adapter.js";

describe("CryptoTokenHasher Adapter", () => {
  let hasher: WebCryptoTokenHasher;

  beforeEach(() => {
    hasher = new WebCryptoTokenHasher();
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
});
