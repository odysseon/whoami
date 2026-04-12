import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AccountId } from "./account-id.vo.js";
import { InvalidAccountIdError } from "../errors/domain.error.js";

describe("AccountId", () => {
  it("creates with valid string", () => {
    const id = new AccountId("uuid-123");
    assert.equal(id.value, "uuid-123");
  });

  it("throws on empty string", () => {
    assert.throws(() => new AccountId(""), InvalidAccountIdError);
  });

  it("throws on whitespace-only string", () => {
    assert.throws(() => new AccountId("   "), InvalidAccountIdError);
  });

  it("equals returns true for same value", () => {
    assert.ok(new AccountId("x").equals(new AccountId("x")));
  });

  it("equals returns false for different value", () => {
    assert.ok(!new AccountId("x").equals(new AccountId("y")));
  });
});
