import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Receipt } from "./receipt.entity.js";
import { AccountId } from "../shared/value-objects/account-id.vo.js";
import { InvalidReceiptError } from "../shared/errors/domain.error.js";

const accountId = new AccountId("acct-1");
const now = new Date("2025-01-01T00:00:00Z");
const expiresAt = new Date("2025-01-01T01:00:00Z");

describe("Receipt.issue", () => {
  it("creates with valid inputs", () => {
    const r = Receipt.issue({ token: "tok", accountId, expiresAt, now });
    assert.equal(r.token, "tok");
    assert.deepEqual(r.accountId, accountId);
  });

  it("throws on empty token", () => {
    assert.throws(
      () => Receipt.issue({ token: "", accountId, expiresAt, now }),
      InvalidReceiptError,
    );
  });

  it("throws when expiresAt is not in the future", () => {
    assert.throws(
      () => Receipt.issue({ token: "tok", accountId, expiresAt: now, now }),
      InvalidReceiptError,
    );
  });
});

describe("Receipt.loadExisting", () => {
  it("rehydrates without validation", () => {
    const r = Receipt.loadExisting("tok", { accountId, expiresAt });
    assert.equal(r.token, "tok");
  });
});
