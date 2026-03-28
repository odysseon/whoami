import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { InvalidEmailError } from "../errors/validation.error.js";
import { InvalidAccountIdError, AccountId } from "./account-id.vo.js";
import { InvalidCredentialIdError, CredentialId } from "./credential-id.vo.js";
import { EmailAddress } from "./email-address.vo.js";

describe("EmailAddress", () => {
  it("normalises to lowercase and trims whitespace", () => {
    const vo = new EmailAddress("  USER@Example.COM  ");
    assert.equal(vo.value, "user@example.com");
  });

  it("throws InvalidEmailError for an empty string", () => {
    assert.throws(() => new EmailAddress(""), InvalidEmailError);
  });

  it("throws InvalidEmailError for a whitespace-only string", () => {
    assert.throws(() => new EmailAddress("   "), InvalidEmailError);
  });

  it("throws InvalidEmailError when the @ symbol is absent", () => {
    assert.throws(() => new EmailAddress("notanemail"), InvalidEmailError);
  });

  it("considers two addresses equal when their normalised values match", () => {
    const a = new EmailAddress("user@example.com");
    const b = new EmailAddress("USER@EXAMPLE.COM");
    assert.ok(a.equals(b));
  });

  it("considers two addresses unequal when they differ", () => {
    const a = new EmailAddress("a@example.com");
    const b = new EmailAddress("b@example.com");
    assert.ok(!a.equals(b));
  });
});

describe("AccountId", () => {
  it("accepts a string value", () => {
    const id = new AccountId("acc_1");
    assert.equal(id.value, "acc_1");
  });

  it("accepts a numeric value", () => {
    const id = new AccountId(42);
    assert.equal(id.value, 42);
  });

  it("throws InvalidAccountIdError for an empty string", () => {
    assert.throws(() => new AccountId(""), InvalidAccountIdError);
  });

  it("throws InvalidAccountIdError for a whitespace-only string", () => {
    assert.throws(() => new AccountId("   "), InvalidAccountIdError);
  });

  it("considers two ids equal when their values match", () => {
    const a = new AccountId("acc_1");
    const b = new AccountId("acc_1");
    assert.ok(a.equals(b));
  });

  it("considers two ids unequal when their values differ", () => {
    const a = new AccountId("acc_1");
    const b = new AccountId("acc_2");
    assert.ok(!a.equals(b));
  });
});

describe("CredentialId", () => {
  it("accepts a string value", () => {
    const id = new CredentialId("cred_1");
    assert.equal(id.value, "cred_1");
  });

  it("accepts a numeric value", () => {
    const id = new CredentialId(7);
    assert.equal(id.value, 7);
  });

  it("throws InvalidCredentialIdError for an empty string", () => {
    assert.throws(() => new CredentialId(""), InvalidCredentialIdError);
  });

  it("throws InvalidCredentialIdError for a whitespace-only string", () => {
    assert.throws(() => new CredentialId("   "), InvalidCredentialIdError);
  });

  it("considers two ids equal when their values match", () => {
    const a = new CredentialId("cred_1");
    const b = new CredentialId("cred_1");
    assert.ok(a.equals(b));
  });

  it("considers two ids unequal when their values differ", () => {
    const a = new CredentialId("cred_1");
    const b = new CredentialId("cred_2");
    assert.ok(!a.equals(b));
  });
});
