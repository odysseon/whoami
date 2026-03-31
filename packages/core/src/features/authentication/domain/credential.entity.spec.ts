import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { WrongCredentialTypeError } from "../../../shared/domain/errors/auth.error.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { CredentialId } from "../../../shared/domain/value-objects/credential-id.vo.js";
import { Credential } from "./credential.entity.js";

const credId = new CredentialId("cred_1");
const accountId = new AccountId("acc_1");

describe("Credential — password proof", () => {
  const credential = Credential.loadExisting(credId, {
    accountId,
    proof: {
      kind: "password",
      hash: "hashed:secret",
    },
  });

  it("returns the stored hash", () => {
    assert.equal(credential.getPasswordHash(), "hashed:secret");
  });

  it("throws WrongCredentialTypeError when calling isMagicLinkValid on a password credential", () => {
    assert.throws(
      () => credential.isMagicLinkValid(new Date(), "token"),
      WrongCredentialTypeError,
    );
  });

  it("throws WrongCredentialTypeError when calling verifyOAuth on a password credential", () => {
    assert.throws(
      () => credential.verifyOAuth("google", "id_123"),
      WrongCredentialTypeError,
    );
  });
});

describe("Credential — magic-link proof", () => {
  const future = new Date("2099-01-01T00:00:00.000Z");
  const past = new Date("2000-01-01T00:00:00.000Z");
  const now = new Date("2050-01-01T00:00:00.000Z");

  const validCredential = Credential.loadExisting(credId, {
    accountId,
    proof: {
      kind: "magic_link",
      token: "magic-token",
      expiresAt: future,
    },
  });

  it("returns true when token matches and has not expired", () => {
    assert.ok(validCredential.isMagicLinkValid(now, "magic-token"));
  });

  it("returns false when the token is wrong", () => {
    assert.ok(!validCredential.isMagicLinkValid(now, "wrong-token"));
  });

  it("returns false when the link has expired", () => {
    const expiredCredential = Credential.loadExisting(credId, {
      accountId,
      proof: {
        kind: "magic_link",
        token: "magic-token",
        expiresAt: past,
      },
    });
    assert.ok(!expiredCredential.isMagicLinkValid(now, "magic-token"));
  });

  it("returns false when expiresAt is an invalid date", () => {
    const brokenCredential = Credential.loadExisting(credId, {
      accountId,
      proof: {
        kind: "magic_link",
        token: "magic-token",
        expiresAt: new Date("not-a-date"),
      },
    });
    assert.ok(!brokenCredential.isMagicLinkValid(now, "magic-token"));
  });

  it("throws WrongCredentialTypeError when calling getPasswordHash on a magic-link credential", () => {
    assert.throws(
      () => validCredential.getPasswordHash(),
      WrongCredentialTypeError,
    );
  });

  it("throws WrongCredentialTypeError when calling verifyOAuth on a magic-link credential", () => {
    assert.throws(
      () => validCredential.verifyOAuth("google", "id_123"),
      WrongCredentialTypeError,
    );
  });
});

describe("Credential — OAuth proof", () => {
  const credential = Credential.loadExisting(credId, {
    accountId,
    proof: {
      kind: "oauth",
      provider: "google",
      providerId: "google_123",
    },
  });

  it("returns true when provider and providerId match", () => {
    assert.ok(credential.verifyOAuth("google", "google_123"));
  });

  it("returns false when the provider differs", () => {
    assert.ok(!credential.verifyOAuth("github", "google_123"));
  });

  it("returns false when the providerId differs", () => {
    assert.ok(!credential.verifyOAuth("google", "other_id"));
  });

  it("throws WrongCredentialTypeError when calling getPasswordHash on an OAuth credential", () => {
    assert.throws(() => credential.getPasswordHash(), WrongCredentialTypeError);
  });

  it("throws WrongCredentialTypeError when calling isMagicLinkValid on an OAuth credential", () => {
    assert.throws(
      () => credential.isMagicLinkValid(new Date(), "token"),
      WrongCredentialTypeError,
    );
  });
});

describe("Credential.createPassword()", () => {
  it("creates a new password credential", () => {
    const credential = Credential.createPassword(credId, {
      accountId,
      hash: "hashed:secret",
    });

    assert.equal(credential.getPasswordHash(), "hashed:secret");
  });

  it("throws when the hash is empty", () => {
    assert.throws(
      () =>
        Credential.createPassword(credId, {
          accountId,
          hash: "",
        }),
      Error,
    );
  });
});

describe("Credential.createMagicLink()", () => {
  const expiresAt = new Date("2099-12-31T23:59:59.999Z");

  it("creates a new magic-link credential", () => {
    const credential = Credential.createMagicLink(credId, {
      accountId,
      token: "hashed-token",
      expiresAt,
    });

    assert.ok(
      credential.isMagicLinkValid(
        new Date("2099-01-01T00:00:00.000Z"),
        "hashed-token",
      ),
    );
  });

  it("throws when the token is empty", () => {
    assert.throws(
      () =>
        Credential.createMagicLink(credId, {
          accountId,
          token: "",
          expiresAt,
        }),
      Error,
    );
  });

  it("throws when expiresAt is not a valid Date", () => {
    assert.throws(
      () =>
        Credential.createMagicLink(credId, {
          accountId,
          token: "hashed-token",
          expiresAt: new Date("invalid-date"),
        }),
      Error,
    );
  });
});

describe("Credential.createOAuth()", () => {
  it("creates a new OAuth credential with the supplied data", () => {
    const cred = Credential.createOAuth(credId, {
      accountId,
      provider: "github",
      providerId: "gh_456",
    });
    assert.ok(cred.verifyOAuth("github", "gh_456"));
  });

  it("throws when provider is empty", () => {
    assert.throws(
      () =>
        Credential.createOAuth(credId, {
          accountId,
          provider: "",
          providerId: "gh_456",
        }),
      Error,
    );
  });

  it("throws when providerId is empty", () => {
    assert.throws(
      () =>
        Credential.createOAuth(credId, {
          accountId,
          provider: "github",
          providerId: "",
        }),
      Error,
    );
  });
});
