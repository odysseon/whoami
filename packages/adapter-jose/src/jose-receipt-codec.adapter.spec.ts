import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { AccountId, InvalidReceiptError } from "@odysseon/whoami-core";
import { JoseReceiptCodec } from "./jose-receipt-codec.adapter.js";

describe("JoseReceiptCodec", () => {
  const validSecret = "super_secret_key_that_is_at_least_32_chars_long!!";

  it("signs and verifies a receipt token", async () => {
    const codec = new JoseReceiptCodec({
      secret: validSecret,
      issuer: "odysseon-auth",
      audience: "odysseon-users",
    });
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const token = await codec.sign(new AccountId("acc_1"), expiresAt);
    const receipt = await codec.verify(token);

    assert.equal(receipt.accountId.value, "acc_1");
    assert.equal(
      receipt.expiresAt.toISOString(),
      new Date(Math.floor(expiresAt.getTime() / 1000) * 1000).toISOString(),
    );
    assert.equal(receipt.token, token);
  });

  it("rejects weak secrets", () => {
    assert.throws(
      () => new JoseReceiptCodec({ secret: "too_short" }),
      /at least 32 characters/,
    );
  });

  it("rejects invalid tokens", async () => {
    const codec = new JoseReceiptCodec({ secret: validSecret });

    await assert.rejects(
      () => codec.verify("invalid.receipt.token"),
      InvalidReceiptError,
    );
  });
});
