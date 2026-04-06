import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { BearerTokenExtractor } from "./bearer-token.extractor.js";

describe("BearerTokenExtractor", () => {
  const extractor = new BearerTokenExtractor();

  it("should extract a valid bearer token", () => {
    const req = { headers: { authorization: "Bearer valid.jwt.token" } };
    assert.equal(extractor.extract(req), "valid.jwt.token");
  });

  it("should return null if authorization header is missing", () => {
    const req = { headers: {} };
    assert.equal(extractor.extract(req), null);
  });

  it("should return null if scheme is not Bearer", () => {
    const req = { headers: { authorization: "Basic dXNlcjpwYXNz" } };
    assert.equal(extractor.extract(req), null);
  });

  it("should return null if token part is missing", () => {
    const req = { headers: { authorization: "Bearer " } };
    assert.equal(extractor.extract(req), null);
  });

  it("should handle completely empty or malformed request objects safely", () => {
    assert.equal(extractor.extract({}), null);
    assert.equal(extractor.extract(null), null);
    assert.equal(extractor.extract(undefined), null);
  });
});
