import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { JoseReceiptSigner } from "./jose-receipt-signer.adapter.js";

describe("JoseReceiptSigner", () => {
  it("rejects weak secrets", () => {
    assert.throws(
      () => new JoseReceiptSigner({ secret: "too_short" }),
      /at least 32 characters/,
    );
  });
});
