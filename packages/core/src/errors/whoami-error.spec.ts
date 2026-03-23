import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { WhoamiError } from "./whoami-error.js";

describe("WhoamiError", () => {
  it("should instantiate correctly with the provided code and message", () => {
    const error = new WhoamiError(
      "INVALID_CREDENTIALS",
      "The provided password was incorrect.",
    );

    assert.equal(error.code, "INVALID_CREDENTIALS");
    assert.equal(error.message, "The provided password was incorrect.");
    assert.equal(error.name, "WhoamiError");
  });

  it("should correctly extend the native Error class", () => {
    const error = new WhoamiError("USER_NOT_FOUND", "User does not exist.");

    assert.ok(error instanceof Error);
    assert.ok(error instanceof WhoamiError);
  });

  it("should capture the stack trace", () => {
    const error = new WhoamiError("TOKEN_EXPIRED", "Token is no longer valid.");

    assert.ok(error.stack);
    assert.match(error.stack, /WhoamiError: Token is no longer valid\./);
  });
});
