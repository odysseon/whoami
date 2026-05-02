import { test } from "node:test";
import assert from "node:assert";
import { WebCryptoSecureTokenAdapter } from "../src/webcrypto-secure-token.adapter.ts";

test("verifyToken rejects mismatched tokens", async () => {
  const adapter = new WebCryptoSecureTokenAdapter();
  const token = adapter.generateToken();
  const hash = await adapter.hashToken(token);

  assert.strictEqual(await adapter.verifyToken(token, hash), true);
  assert.strictEqual(await adapter.verifyToken(token + "x", hash), false);
  assert.strictEqual(
    await adapter.verifyToken(token.slice(0, -1), hash),
    false,
  );
});
