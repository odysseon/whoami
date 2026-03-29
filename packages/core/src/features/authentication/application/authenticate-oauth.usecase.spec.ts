/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { AuthenticationError } from "../../../shared/domain/errors/auth.error.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { CredentialId } from "../../../shared/domain/value-objects/credential-id.vo.js";
import { Credential } from "../domain/credential.entity.js";
import { Account } from "../../accounts/domain/account.entity.js";
import { EmailAddress } from "../../../shared/domain/value-objects/email-address.vo.js";
import { AuthenticateOAuthUseCase } from "./authenticate-oauth.usecase.js";

const noopLogger = {
  info: (): void => undefined,
  warn: (): void => undefined,
  error: (): void => undefined,
};

let idCounter = 0;
const generateId = (): string => `id_${++idCounter}`;

function makeAccount(id = "acc_1", email = "user@example.com") {
  return Account.create(new AccountId(id), new EmailAddress(email));
}

function makeOAuthCredential(accountId = "acc_1") {
  return Credential.loadExisting(
    new CredentialId("cred_1"),
    new AccountId(accountId),
    {
      kind: "oauth",
      provider: "google",
      providerId: "google_123",
    },
  );
}

describe("AuthenticateOAuthUseCase — new user (auto-registration)", () => {
  it("creates an account and links a credential when neither exist", async () => {
    const savedAccounts: Account[] = [];
    const savedCredentials: Credential[] = [];

    const useCase = new AuthenticateOAuthUseCase({
      accountRepository: {
        findByEmail: async () => null,
        findById: async () => null,
        save: async (a) => {
          savedAccounts.push(a);
        },
      },
      credentialStore: {
        findByEmail: async () => null,
        save: async (c) => {
          savedCredentials.push(c);
        },
      },
      generateId,
      logger: noopLogger,
    });

    const result = await useCase.execute({
      rawEmail: "new@example.com",
      provider: "google",
      providerId: "google_new",
    });

    assert.ok(result instanceof AccountId);
    assert.equal(savedAccounts.length, 1);
    assert.equal(savedAccounts[0].email.value, "new@example.com");
    assert.equal(savedCredentials.length, 1);
  });
});

describe("AuthenticateOAuthUseCase — existing account, new OAuth credential", () => {
  it("links a new credential to an existing account", async () => {
    const existingAccount = makeAccount("acc_existing");
    const savedCredentials: Credential[] = [];

    const useCase = new AuthenticateOAuthUseCase({
      accountRepository: {
        findByEmail: async () => existingAccount,
        findById: async () => null,
        save: async () => undefined,
      },
      credentialStore: {
        findByEmail: async () => null,
        save: async (c) => {
          savedCredentials.push(c);
        },
      },
      generateId,
      logger: noopLogger,
    });

    const result = await useCase.execute({
      rawEmail: "user@example.com",
      provider: "github",
      providerId: "gh_999",
    });

    assert.equal(result.value, existingAccount.id.value);
    assert.equal(savedCredentials.length, 1);
  });
});

describe("AuthenticateOAuthUseCase — returning user with matching credential", () => {
  it("verifies the OAuth credential and returns the account id", async () => {
    const existingAccount = makeAccount("acc_1");
    const existingCredential = makeOAuthCredential("acc_1");

    const useCase = new AuthenticateOAuthUseCase({
      accountRepository: {
        findByEmail: async () => existingAccount,
        findById: async () => null,
        save: async () => undefined,
      },
      credentialStore: {
        findByEmail: async () => existingCredential,
        save: async () => undefined,
      },
      generateId,
      logger: noopLogger,
    });

    const result = await useCase.execute({
      rawEmail: "user@example.com",
      provider: "google",
      providerId: "google_123",
    });

    assert.equal(result.value, "acc_1");
  });

  it("throws AuthenticationError when the providerId does not match", async () => {
    const existingAccount = makeAccount("acc_1");
    const existingCredential = makeOAuthCredential("acc_1");

    const useCase = new AuthenticateOAuthUseCase({
      accountRepository: {
        findByEmail: async () => existingAccount,
        findById: async () => null,
        save: async () => undefined,
      },
      credentialStore: {
        findByEmail: async () => existingCredential,
        save: async () => undefined,
      },
      generateId,
      logger: noopLogger,
    });

    await assert.rejects(
      () =>
        useCase.execute({
          rawEmail: "user@example.com",
          provider: "google",
          providerId: "spoofed_id",
        }),
      AuthenticationError,
    );
  });
});

describe("AuthenticateOAuthUseCase — cross-auth rejection", () => {
  it("throws AuthenticationError and logs a warning when account uses a different credential type", async () => {
    const warnings: string[] = [];
    const existingAccount = makeAccount("acc_1");
    const passwordCredential = Credential.loadExisting(
      new CredentialId("cred_pw"),
      new AccountId("acc_1"),
      { kind: "password", hash: "hashed" },
    );

    const useCase = new AuthenticateOAuthUseCase({
      accountRepository: {
        findByEmail: async () => existingAccount,
        findById: async () => null,
        save: async () => undefined,
      },
      credentialStore: {
        findByEmail: async () => passwordCredential,
        save: async () => undefined,
      },
      generateId,
      logger: {
        ...noopLogger,
        warn: (m: unknown): void => {
          warnings.push(String(m));
        },
      },
    });

    await assert.rejects(
      () =>
        useCase.execute({
          rawEmail: "user@example.com",
          provider: "google",
          providerId: "google_123",
        }),
      AuthenticationError,
    );
    assert.equal(warnings.length, 1);
  });
});

describe("AuthenticateOAuthUseCase — invalid input", () => {
  it("throws for an invalid email address", async () => {
    const useCase = new AuthenticateOAuthUseCase({
      accountRepository: {
        findByEmail: async () => null,
        findById: async () => null,
        save: async () => undefined,
      },
      credentialStore: {
        findByEmail: async () => null,
        save: async () => undefined,
      },
      generateId,
      logger: noopLogger,
    });

    await assert.rejects(() =>
      useCase.execute({
        rawEmail: "not-an-email",
        provider: "google",
        providerId: "x",
      }),
    );
  });
});
