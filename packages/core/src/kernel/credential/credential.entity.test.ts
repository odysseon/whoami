import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Credential } from "./credential.entity.js";
import { PasswordProof, OAuthProof } from "./credential.types.js";
import { AccountId } from "../shared/value-objects/account-id.vo.js";
import { CredentialId } from "../shared/value-objects/credential-id.vo.js";
import { InvalidCredentialError } from "../shared/errors/domain.error.js";

const id = new CredentialId("cred-1");
const accountId = new AccountId("acct-1");

describe("Credential.createPassword", () => {
  it("creates with valid hash and proof is PasswordProof", () => {
    const c = Credential.createPassword({ id, accountId, hash: "hashed" });
    assert.equal(c.proofKind, "password");
    const proof = c.getProof();
    assert.ok(proof instanceof PasswordProof);
    assert.equal((proof as PasswordProof).hash, "hashed");
  });

  it("throws on empty hash", () => {
    assert.throws(
      () => Credential.createPassword({ id, accountId, hash: "" }),
      InvalidCredentialError,
    );
  });

  it("proof serializes to JSON containing kind and hash", () => {
    const c = Credential.createPassword({ id, accountId, hash: "h" });
    const raw = c.getProof().serialize();
    const parsed = JSON.parse(raw);
    assert.deepEqual(parsed, { kind: "password", hash: "h" });
  });
});

describe("Credential.createOAuth", () => {
  it("creates with valid provider and providerId and proof is OAuthProof", () => {
    const c = Credential.createOAuth({
      id,
      accountId,
      provider: "google",
      providerId: "sub-123",
    });
    assert.equal(c.proofKind, "oauth");
    const proof = c.getProof();
    assert.ok(proof instanceof OAuthProof);
    assert.equal((proof as OAuthProof).provider, "google");
    assert.equal((proof as OAuthProof).providerId, "sub-123");
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

  it("throws on empty providerId", () => {
    assert.throws(
      () =>
        Credential.createOAuth({
          id,
          accountId,
          provider: "google",
          providerId: "",
        }),
      InvalidCredentialError,
    );
  });

  it("proof serializes to JSON containing kind, provider, and providerId", () => {
    const c = Credential.createOAuth({
      id,
      accountId,
      provider: "google",
      providerId: "sub-123",
    });
    const raw = c.getProof().serialize();
    const parsed = JSON.parse(raw);
    assert.deepEqual(parsed, {
      kind: "oauth",
      provider: "google",
      providerId: "sub-123",
    });
  });
});

describe("Credential.loadExisting", () => {
  it("rehydrates password proof via PasswordProof instance", () => {
    const proof = new PasswordProof("stored-hash");
    const c = Credential.loadExisting({ id, accountId, proof });
    assert.equal(c.proofKind, "password");
    assert.ok(c.getProof() instanceof PasswordProof);
    assert.equal((c.getProof() as PasswordProof).hash, "stored-hash");
  });

  it("rehydrates oauth proof via OAuthProof instance", () => {
    const proof = new OAuthProof("github", "user-456");
    const c = Credential.loadExisting({ id, accountId, proof });
    assert.equal(c.proofKind, "oauth");
    assert.ok(c.getProof() instanceof OAuthProof);
    assert.equal((c.getProof() as OAuthProof).provider, "github");
  });
});
