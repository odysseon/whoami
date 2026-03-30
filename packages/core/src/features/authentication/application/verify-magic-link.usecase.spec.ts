/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { AuthenticationError } from "../../../shared/domain/errors/auth.error.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { CredentialId } from "../../../shared/domain/value-objects/credential-id.vo.js";
import { EmailAddress } from "../../../shared/domain/value-objects/email-address.vo.js";
import { Credential } from "../domain/credential.entity.js";
import { VerifyMagicLinkUseCase } from "./verify-magic-link.usecase.js";

const noopLogger = {
  info: (): void => undefined,
  warn: (): void => undefined,
  error: (): void => undefined,
};

const BEFORE_EXPIRY = new Date("2026-03-27T10:00:00.000Z");
const EXPIRY = new Date("2026-03-27T10:30:00.000Z");
const AFTER_EXPIRY = new Date("2026-03-27T11:00:00.000Z");

function makeMagicLinkCredential(accountId = "acc_1") {
  return Credential.loadExisting(
    new CredentialId("cred_1"),
    new AccountId(accountId),
    { kind: "magic_link", token: "magic-token", expiresAt: EXPIRY },
  );
}

function makeStore(credential: Credential | null = null) {
  return {
    findByEmail: async () => credential,
    save: async (): Promise<void> => undefined,
    deleteByEmail: async (): Promise<void> => undefined,
  };
}

describe("VerifyMagicLinkUseCase", () => {
  it("returns the account id for a valid token before expiry", async () => {
    const useCase = new VerifyMagicLinkUseCase({
      credentialStore: makeStore(makeMagicLinkCredential()),
      logger: noopLogger,
    });

    const result = await useCase.execute({
      rawEmail: "user@example.com",
      token: "magic-token",
      currentTime: BEFORE_EXPIRY,
    });

    assert.equal(result.value, "acc_1");
  });

  it("deletes the credential after successful verification (one-time use)", async () => {
    const deletedEmails: string[] = [];

    const useCase = new VerifyMagicLinkUseCase({
      credentialStore: {
        findByEmail: async () => makeMagicLinkCredential(),
        save: async (): Promise<void> => undefined,
        deleteByEmail: async (email: EmailAddress): Promise<void> => {
          deletedEmails.push(email.value);
        },
      },
      logger: noopLogger,
    });

    await useCase.execute({
      rawEmail: "user@example.com",
      token: "magic-token",
      currentTime: BEFORE_EXPIRY,
    });

    assert.equal(deletedEmails.length, 1);
    assert.equal(deletedEmails[0], "user@example.com");
  });

  it("does not delete the credential when the token is invalid", async () => {
    const deletedEmails: string[] = [];

    const useCase = new VerifyMagicLinkUseCase({
      credentialStore: {
        findByEmail: async () => makeMagicLinkCredential(),
        save: async (): Promise<void> => undefined,
        deleteByEmail: async (email: EmailAddress): Promise<void> => {
          deletedEmails.push(email.value);
        },
      },
      logger: noopLogger,
    });

    await assert.rejects(
      () =>
        useCase.execute({
          rawEmail: "user@example.com",
          token: "wrong-token",
          currentTime: BEFORE_EXPIRY,
        }),
      AuthenticationError,
    );

    assert.equal(deletedEmails.length, 0);
  });

  it("does not delete the credential when no credential is found", async () => {
    const deletedEmails: string[] = [];

    const useCase = new VerifyMagicLinkUseCase({
      credentialStore: {
        findByEmail: async () => null,
        save: async (): Promise<void> => undefined,
        deleteByEmail: async (email: EmailAddress): Promise<void> => {
          deletedEmails.push(email.value);
        },
      },
      logger: noopLogger,
    });

    await assert.rejects(
      () =>
        useCase.execute({
          rawEmail: "user@example.com",
          token: "magic-token",
          currentTime: BEFORE_EXPIRY,
        }),
      AuthenticationError,
    );

    assert.equal(deletedEmails.length, 0);
  });

  it("throws AuthenticationError when no credential is found", async () => {
    const useCase = new VerifyMagicLinkUseCase({
      credentialStore: makeStore(null),
      logger: noopLogger,
    });

    await assert.rejects(
      () =>
        useCase.execute({
          rawEmail: "user@example.com",
          token: "magic-token",
          currentTime: BEFORE_EXPIRY,
        }),
      AuthenticationError,
    );
  });

  it("throws AuthenticationError when the token has expired", async () => {
    const useCase = new VerifyMagicLinkUseCase({
      credentialStore: makeStore(makeMagicLinkCredential()),
      logger: noopLogger,
    });

    await assert.rejects(
      () =>
        useCase.execute({
          rawEmail: "user@example.com",
          token: "magic-token",
          currentTime: AFTER_EXPIRY,
        }),
      AuthenticationError,
    );
  });

  it("throws AuthenticationError when the token does not match", async () => {
    const useCase = new VerifyMagicLinkUseCase({
      credentialStore: makeStore(makeMagicLinkCredential()),
      logger: noopLogger,
    });

    await assert.rejects(
      () =>
        useCase.execute({
          rawEmail: "user@example.com",
          token: "wrong-token",
          currentTime: BEFORE_EXPIRY,
        }),
      AuthenticationError,
    );
  });

  it("masks WrongCredentialTypeError as AuthenticationError and logs a warning", async () => {
    const warnings: string[] = [];
    const passwordCredential = Credential.loadExisting(
      new CredentialId("cred_pw"),
      new AccountId("acc_1"),
      { kind: "password", hash: "hashed" },
    );

    const useCase = new VerifyMagicLinkUseCase({
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
          token: "magic-token",
          currentTime: BEFORE_EXPIRY,
        }),
      AuthenticationError,
    );
    assert.equal(warnings.length, 1);
  });

  it("logs a warning when no credential is found", async () => {
    const warnings: string[] = [];

    const useCase = new VerifyMagicLinkUseCase({
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
          token: "magic-token",
          currentTime: BEFORE_EXPIRY,
        }),
      AuthenticationError,
    );

    assert.equal(warnings.length, 1);
  });

  it("logs a warning when the token is invalid or expired", async () => {
    const warnings: string[] = [];

    const useCase = new VerifyMagicLinkUseCase({
      credentialStore: makeStore(makeMagicLinkCredential()),
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
          token: "wrong-token",
          currentTime: BEFORE_EXPIRY,
        }),
      AuthenticationError,
    );

    assert.equal(warnings.length, 1);
  });
});
