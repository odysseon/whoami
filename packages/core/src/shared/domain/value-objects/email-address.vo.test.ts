import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EmailAddress } from "./email-address.vo.js";
import { InvalidEmailError } from "../errors/validation.error.js";

describe("EmailAddress", () => {
  it("normalises to lowercase", () => {
    assert.equal(
      new EmailAddress("User@Example.COM").value,
      "user@example.com",
    );
  });
  it("trims whitespace", () => {
    assert.equal(new EmailAddress("  a@b.com  ").value, "a@b.com");
  });
  it("equals() returns true for same address", () => {
    assert.ok(new EmailAddress("a@b.com").equals(new EmailAddress("A@B.COM")));
  });
  it("equals() returns false for different address", () => {
    assert.ok(!new EmailAddress("a@b.com").equals(new EmailAddress("c@b.com")));
  });
  it("throws InvalidEmailError for empty string", () => {
    assert.throws(() => new EmailAddress(""), InvalidEmailError);
  });
  it("throws for missing @", () => {
    assert.throws(() => new EmailAddress("nodomain"), InvalidEmailError);
  });
  it("throws for missing domain dot", () => {
    assert.throws(() => new EmailAddress("a@nodot"), InvalidEmailError);
  });
  it("throws for leading @", () => {
    assert.throws(() => new EmailAddress("@b.com"), InvalidEmailError);
  });
  it("throws for multiple @", () => {
    assert.throws(() => new EmailAddress("a@@b.com"), InvalidEmailError);
  });
});
