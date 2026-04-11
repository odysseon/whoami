import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Credential } from "./credential.entity.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { CredentialId } from "../../../shared/domain/value-objects/credential-id.vo.js";
import { WrongCredentialTypeError } from "../../../shared/domain/errors/auth.error.js";
import { InvalidCredentialError } from "../../../shared/domain/errors/validation.error.js";

const accountId = new AccountId("acc-1");
const credId = new CredentialId("cred-1");

describe("Credential.createPassword", () => {
  it("creates with valid hash", () => {
    const c = Credential.createPassword({
      id: credId,
      accountId,
      hash: "hashed",
    });
    assert.equal(c.passwordHash, "hashed");
    assert.equal(c.proofKind, "password");
  });
  it("throws for empty hash", () => {
    assert.throws(
      () => Credential.createPassword({ id: credId, accountId, hash: "" }),
      InvalidCredentialError,
    );
  });
  it("throws accessing oauthProvider on password credential", () => {
    const c = Credential.createPassword({ id: credId, accountId, hash: "h" });
    assert.throws(() => c.oauthProvider, WrongCredentialTypeError);
  });
});

describe("Credential.createOAuth", () => {
  it("creates with valid provider/providerId", () => {
    const c = Credential.createOAuth({
      id: credId,
      accountId,
      provider: "google",
      providerId: "sub-123",
    });
    assert.equal(c.oauthProvider, "google");
    assert.equal(c.oauthProviderId, "sub-123");
  });
  it("throws for empty provider", () => {
    assert.throws(
      () =>
        Credential.createOAuth({
          id: credId,
          accountId,
          provider: "",
          providerId: "x",
        }),
      InvalidCredentialError,
    );
  });
  it("throws for empty providerId", () => {
    assert.throws(
      () =>
        Credential.createOAuth({
          id: credId,
          accountId,
          provider: "google",
          providerId: "",
        }),
      InvalidCredentialError,
    );
  });
  it("throws accessing passwordHash on oauth credential", () => {
    const c = Credential.createOAuth({
      id: credId,
      accountId,
      provider: "google",
      providerId: "x",
    });
    assert.throws(() => c.passwordHash, WrongCredentialTypeError);
  });
});
