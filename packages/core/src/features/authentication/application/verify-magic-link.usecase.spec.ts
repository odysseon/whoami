/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { AuthenticationError } from "../../../shared/domain/errors/auth.error.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { CredentialId } from "../../../shared/domain/value-objects/credential-id.vo.js";
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
    {
      kind: "magic_link",
      token: "magic-token",
      expiresAt: EXPIRY,
    },
  );
}

describe("VerifyMagicLinkUseCase", () => {
  it("returns the account id for a valid token before expiry", async () => {
    const useCase = new VerifyMagicLinkUseCase(
      { findByEmail: async () => makeMagicLinkCredential() },
      noopLogger,
    );

    const result = await useCase.execute({
      rawEmail: "user@example.com",
      token: "magic-token",
      currentTime: BEFORE_EXPIRY,
    });

    assert.equal(result.value, "acc_1");
  });

  it("throws AuthenticationError when no credential is found", async () => {
    const useCase = new VerifyMagicLinkUseCase(
      { findByEmail: async () => null },
      noopLogger,
    );

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
    const useCase = new VerifyMagicLinkUseCase(
      { findByEmail: async () => makeMagicLinkCredential() },
      noopLogger,
    );

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
    const useCase = new VerifyMagicLinkUseCase(
      { findByEmail: async () => makeMagicLinkCredential() },
      noopLogger,
    );

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

    const useCase = new VerifyMagicLinkUseCase(
      { findByEmail: async () => passwordCredential },
      {
        ...noopLogger,
        warn: (m: unknown) => {
          warnings.push(String(m));
        },
      },
    );

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
});
