import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Credential } from "./credential.entity.js";
import { AccountId } from "../shared/value-objects/account-id.vo.js";
import { CredentialId } from "../shared/value-objects/credential-id.vo.js";
import {
  WrongCredentialTypeError,
  InvalidCredentialError,
} from "../shared/errors/domain.error.js";

const id = new CredentialId("cred-1");
const accountId = new AccountId("acct-1");

describe("Credential.createPassword", () => {
  it("creates with valid hash", () => {
    const c = Credential.createPassword({ id, accountId, hash: "hashed" });
    assert.equal(c.proofKind, "password");
    assert.equal(c.passwordHash, "hashed");
  });

  it("throws on empty hash", () => {
    assert.throws(
      () => Credential.createPassword({ id, accountId, hash: "" }),
      InvalidCredentialError,
    );
  });

  it("throws when accessing oauthProvider on password credential", () => {
    const c = Credential.createPassword({ id, accountId, hash: "h" });
    assert.throws(() => c.oauthProvider, WrongCredentialTypeError);
  });
});

describe("Credential.createOAuth", () => {
  it("creates with valid provider and providerId", () => {
    const c = Credential.createOAuth({
      id,
      accountId,
      provider: "google",
      providerId: "sub-123",
    });
    assert.equal(c.proofKind, "oauth");
    assert.equal(c.oauthProvider, "google");
    assert.equal(c.oauthProviderId, "sub-123");
  });

  it("throws on empty provider", () => {
    assert.throws(
      () =>
        Credential.createOAuth({
          id,
          accountId,
          provider: "",
          providerId: "x",
        }),
      InvalidCredentialError,
    );
  });

  it("throws when accessing passwordHash on oauth credential", () => {
    const c = Credential.createOAuth({
      id,
      accountId,
      provider: "google",
      providerId: "x",
    });
    assert.throws(() => c.passwordHash, WrongCredentialTypeError);
  });
});

describe("Credential.loadExisting", () => {
  it("rehydrates password proof", () => {
    const c = Credential.loadExisting({
      id,
      accountId,
      proof: { kind: "password", hash: "h" },
    });
    assert.equal(c.passwordHash, "h");
  });
});
