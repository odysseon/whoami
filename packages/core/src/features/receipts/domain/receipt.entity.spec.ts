import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { InvalidReceiptError } from "../../../shared/domain/errors/auth.error.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { Receipt } from "./receipt.entity.js";

const accountId = new AccountId("acc_1");
const now = new Date("2026-01-01T12:00:00.000Z");
const future = new Date("2026-01-01T13:00:00.000Z");

// packages/core/src/features/receipts/domain/receipt.entity.spec.ts
describe("Receipt.issue()", () => {
  it("creates a receipt with a valid token and future expiry", () => {
    const receipt = Receipt.issue({
      token: "signed-token",
      accountId,
      expiresAt: future,
      now,
    });
    assert.equal(receipt.token, "signed-token");
    assert.equal(receipt.accountId.value, "acc_1");
    assert.deepEqual(receipt.expiresAt, future);
  });

  it("throws InvalidReceiptError when the token is empty", () => {
    assert.throws(
      () =>
        Receipt.issue({
          token: "",
          accountId,
          expiresAt: future,
          now,
        }),
      InvalidReceiptError,
    );
  });

  it("throws InvalidReceiptError when the token is whitespace-only", () => {
    assert.throws(
      () =>
        Receipt.issue({
          token: "   ",
          accountId,
          expiresAt: future,
          now,
        }),
      InvalidReceiptError,
    );
  });

  it("throws InvalidReceiptError when expiresAt is in the past relative to now", () => {
    const past = new Date("2025-12-31T00:00:00.000Z");
    assert.throws(
      () =>
        Receipt.issue({
          token: "signed-token",
          accountId,
          expiresAt: past,
          now,
        }),
      InvalidReceiptError,
    );
  });

  it("throws InvalidReceiptError when expiresAt equals now", () => {
    assert.throws(
      () =>
        Receipt.issue({
          token: "signed-token",
          accountId,
          expiresAt: now,
          now,
        }),
      InvalidReceiptError,
    );
  });
});
