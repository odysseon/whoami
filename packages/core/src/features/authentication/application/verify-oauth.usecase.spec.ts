/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { AuthenticationError } from "../../../shared/domain/errors/auth.error.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { CredentialId } from "../../../shared/domain/value-objects/credential-id.vo.js";
import { Credential } from "../domain/credential.entity.js";
import { VerifyOAuthUseCase } from "./verify-oauth.usecase.js";

const noopLogger = {
  info: (): void => undefined,
  warn: (): void => undefined,
  error: (): void => undefined,
};

const accountId = new AccountId("acc_1");

function makeOAuthCredential() {
  return Credential.loadExisting(new CredentialId("cred_1"), accountId, {
    kind: "oauth",
    provider: "google",
    providerId: "google_123",
  });
}

function makeStore(credential: Credential | null = null) {
  return {
    findByEmail: async () => credential,
    save: async (): Promise<void> => undefined,
    deleteByEmail: async (): Promise<void> => undefined,
  };
}

describe("VerifyOAuthUseCase", () => {
  it("returns the account id for a valid OAuth credential", async () => {
    const useCase = new VerifyOAuthUseCase({
      credentialStore: makeStore(makeOAuthCredential()),
      logger: noopLogger,
    });

    const result = await useCase.execute({
      rawEmail: "user@example.com",
      provider: "google",
      providerId: "google_123",
    });

    assert.equal(result.value, accountId.value);
  });

  it("throws AuthenticationError when no credential is found", async () => {
    const useCase = new VerifyOAuthUseCase({
      credentialStore: makeStore(null),
      logger: noopLogger,
    });

    await assert.rejects(
      () =>
        useCase.execute({
          rawEmail: "user@example.com",
          provider: "google",
          providerId: "x",
        }),
      AuthenticationError,
    );
  });

  it("throws AuthenticationError when providerId does not match", async () => {
    const useCase = new VerifyOAuthUseCase({
      credentialStore: makeStore(makeOAuthCredential()),
      logger: noopLogger,
    });

    await assert.rejects(
      () =>
        useCase.execute({
          rawEmail: "user@example.com",
          provider: "google",
          providerId: "wrong",
        }),
      AuthenticationError,
    );
  });

  it("masks WrongCredentialTypeError as AuthenticationError and logs a warning", async () => {
    const warnings: string[] = [];
    const passwordCredential = Credential.loadExisting(
      new CredentialId("cred_2"),
      accountId,
      { kind: "password", hash: "hashed" },
    );

    const useCase = new VerifyOAuthUseCase({
      credentialStore: makeStore(passwordCredential),
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
          providerId: "x",
        }),
      AuthenticationError,
    );
    assert.equal(warnings.length, 1);
  });

  it("logs a warning when no credential is found", async () => {
    const warnings: string[] = [];

    const useCase = new VerifyOAuthUseCase({
      credentialStore: makeStore(null),
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
          providerId: "x",
        }),
      AuthenticationError,
    );
    assert.equal(warnings.length, 1);
  });

  it("logs a warning when the provider ID does not match", async () => {
    const warnings: string[] = [];

    const useCase = new VerifyOAuthUseCase({
      credentialStore: makeStore(makeOAuthCredential()),
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
          providerId: "wrong",
        }),
      AuthenticationError,
    );
    assert.equal(warnings.length, 1);
  });

  it("throws InvalidEmailError for an invalid email", async () => {
    const useCase = new VerifyOAuthUseCase({
      credentialStore: makeStore(null),
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
