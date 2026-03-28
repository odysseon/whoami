import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { EmailAddress } from "../../../shared/domain/value-objects/email-address.vo.js";
import { Account } from "./account.entity.js";

describe("Account", () => {
  const id = new AccountId("acc_1");
  const email = new EmailAddress("user@example.com");

  it("creates a new account with the supplied id and email", () => {
    const account = Account.create(id, email);
    assert.equal(account.id.value, "acc_1");
    assert.equal(account.email.value, "user@example.com");
  });

  it("rehydrates an existing account with the same shape as create()", () => {
    const account = Account.loadExisting(id, email);
    assert.equal(account.id.value, "acc_1");
    assert.equal(account.email.value, "user@example.com");
  });
});
