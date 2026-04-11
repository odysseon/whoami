import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Receipt } from "./receipt.entity.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { InvalidReceiptError } from "../../../shared/domain/errors/auth.error.js";

const accountId = new AccountId("test-id");
const now = new Date("2024-01-01T00:00:00Z");
const future = new Date("2024-01-01T01:00:00Z");

describe("Receipt.issue", () => {
  it("creates a receipt with valid inputs", () => {
    const r = Receipt.issue({
      token: "tok",
      accountId,
      expiresAt: future,
      now,
    });
    assert.equal(r.token, "tok");
    assert.ok(r.accountId.equals(accountId));
  });
  it("throws for empty token", () => {
    assert.throws(
      () => Receipt.issue({ token: "", accountId, expiresAt: future, now }),
      InvalidReceiptError,
    );
  });
  it("throws for whitespace token", () => {
    assert.throws(
      () => Receipt.issue({ token: "  ", accountId, expiresAt: future, now }),
      InvalidReceiptError,
    );
  });
  it("throws when expiresAt is in the past", () => {
    assert.throws(
      () =>
        Receipt.issue({ token: "tok", accountId, expiresAt: now, now: future }),
      InvalidReceiptError,
    );
  });
  it("throws when expiresAt equals now", () => {
    assert.throws(
      () => Receipt.issue({ token: "tok", accountId, expiresAt: now, now }),
      InvalidReceiptError,
    );
  });
});

describe("Receipt.loadExisting", () => {
  it("bypasses validation", () => {
    const r = Receipt.loadExisting("any", { accountId, expiresAt: now });
    assert.equal(r.token, "any");
  });
});
