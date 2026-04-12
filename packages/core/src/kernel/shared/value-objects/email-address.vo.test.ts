import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EmailAddress } from "./email-address.vo.js";
import { InvalidEmailError } from "../errors/domain.error.js";

describe("EmailAddress", () => {
  it("normalizes to lowercase", () => {
    const e = new EmailAddress("  Test@Example.COM  ");
    assert.equal(e.value, "test@example.com");
  });

  it("throws on invalid email", () => {
    assert.throws(() => new EmailAddress("not-an-email"), InvalidEmailError);
  });

  it("equals compares normalized values", () => {
    assert.ok(new EmailAddress("A@B.com").equals(new EmailAddress("a@b.com")));
  });
});
