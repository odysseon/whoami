import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { AuthenticationError } from "../../../shared/domain/errors/auth.error.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { CredentialId } from "../../../shared/domain/value-objects/credential-id.vo.js";
import { EmailAddress } from "../../../shared/domain/value-objects/email-address.vo.js";
import { VerifyMagicLinkUseCase } from "./verify-magic-link.usecase.js";
import { VerifyPasswordUseCase } from "./verify-password.usecase.js";
import { Credential } from "../domain/credential.entity.js";

const noopLogger = {
  info: (): void => undefined,
  warn: (): void => undefined,
  error: (): void => undefined,
};

describe("Authentication feature use cases", () => {
  it("verifies password credentials", async () => {
    const accountId = new AccountId("acc_1");
    const credential = Credential.loadExisting(
      new CredentialId("cred_1"),
      accountId,
      { kind: "password", hash: "hashed:secret" },
    );
    const useCase = new VerifyPasswordUseCase({
      credentialStore: {
        findByEmail: async (email): Promise<Credential | null> =>
          email.equals(new EmailAddress("user@example.com"))
            ? credential
            : null,
      },
      hasher: {
        compare: async (plainText, hash): Promise<boolean> =>
          hash === `hashed:${plainText}`,
        hash: async (plainText): Promise<string> => `hashed:${plainText}`,
      },
      logger: noopLogger,
    });

    const result = await useCase.execute("user@example.com", "secret");

    assert.equal(result.value, accountId.value);
  });

  it("masks cross-auth password mismatches as authentication failures", async () => {
    const warnings: string[] = [];
    const credential = Credential.loadExisting(
      new CredentialId("cred_2"),
      new AccountId("acc_2"),
      {
        kind: "magic_link",
        token: "token",
        expiresAt: new Date("2026-03-27T10:30:00.000Z"),
      },
    );
    const useCase = new VerifyPasswordUseCase({
      credentialStore: {
        findByEmail: async (): Promise<Credential> => credential,
      },
      hasher: {
        compare: async (): Promise<boolean> => true,
        hash: async (plainText): Promise<string> => plainText,
      },
      logger: {
        info: (): void => undefined,
        warn: (message): void => {
          warnings.push(message);
        },
        error: (): void => undefined,
      },
    });

    await assert.rejects(
      () => useCase.execute("user@example.com", "secret"),
      AuthenticationError,
    );
    assert.equal(warnings.length, 1);
  });

  it("verifies magic-link credentials", async () => {
    const accountId = new AccountId("acc_3");
    const credential = Credential.loadExisting(
      new CredentialId("cred_3"),
      accountId,
      {
        kind: "magic_link",
        token: "magic-token",
        expiresAt: new Date("2026-03-27T10:30:00.000Z"),
      },
    );
    const useCase = new VerifyMagicLinkUseCase({
      credentialStore: {
        findByEmail: async (): Promise<Credential> => credential,
      },
      logger: noopLogger,
    });

    const result = await useCase.execute({
      rawEmail: "user@example.com",
      token: "magic-token",
      currentTime: new Date("2026-03-27T10:00:00.000Z"),
    });

    assert.equal(result.value, accountId.value);
  });
});
