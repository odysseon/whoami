import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AccountId, InvalidAccountIdError } from "./account-id.vo.js";

describe("AccountId", () => {
  it("stores trimmed value", () => {
    assert.equal(new AccountId("  abc  ").value, "abc");
  });
  it("throws for empty string", () => {
    assert.throws(() => new AccountId(""), InvalidAccountIdError);
  });
  it("throws for whitespace-only", () => {
    assert.throws(() => new AccountId("   "), InvalidAccountIdError);
  });
  it("equals() compares by value", () => {
    assert.ok(new AccountId("x").equals(new AccountId("x")));
    assert.ok(!new AccountId("x").equals(new AccountId("y")));
  });
});
