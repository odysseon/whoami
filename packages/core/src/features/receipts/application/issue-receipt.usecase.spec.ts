/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { InvalidConfigurationError } from "../../../shared/domain/errors/validation.error.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { IssueReceiptUseCase } from "./issue-receipt.usecase.js";

const accountId = new AccountId("acc_1");
const frozenNow = new Date("2026-01-01T12:00:00.000Z");

function makeSigner(token = "signed-token") {
  return {
    sign: async (): Promise<string> => token,
  };
}

describe("IssueReceiptUseCase", () => {
  it("issues a receipt with the correct token and expiry", async () => {
    const useCase = new IssueReceiptUseCase({
      signer: makeSigner(),
      tokenLifespanMinutes: 60,
      now: () => frozenNow,
    });

    const receipt = await useCase.execute(accountId);

    assert.equal(receipt.token, "signed-token");
    assert.equal(receipt.accountId.value, "acc_1");

    const expectedExpiry = new Date(frozenNow.getTime());
    expectedExpiry.setMinutes(expectedExpiry.getMinutes() + 60);
    assert.deepEqual(receipt.expiresAt, expectedExpiry);
  });

  it("passes accountId and expiresAt to the signer", async () => {
    const calls: { accountId: AccountId; expiresAt: Date }[] = [];
    const useCase = new IssueReceiptUseCase({
      signer: {
        sign: async (id: AccountId, exp: Date): Promise<string> => {
          calls.push({ accountId: id, expiresAt: exp });
          return "token";
        },
      },
      tokenLifespanMinutes: 30,
      now: () => frozenNow,
    });

    await useCase.execute(accountId);

    assert.equal(calls.length, 1);
    assert.equal(calls[0].accountId.value, "acc_1");
    const expectedExpiry = new Date(frozenNow.getTime());
    expectedExpiry.setMinutes(expectedExpiry.getMinutes() + 30);
    assert.deepEqual(calls[0].expiresAt, expectedExpiry);
  });

  it("defaults tokenLifespanMinutes to 60", async () => {
    const useCase = new IssueReceiptUseCase({
      signer: makeSigner(),
      now: () => frozenNow,
    });

    const receipt = await useCase.execute(accountId);

    const expectedExpiry = new Date(frozenNow.getTime());
    expectedExpiry.setMinutes(expectedExpiry.getMinutes() + 60);
    assert.deepEqual(receipt.expiresAt, expectedExpiry);
  });

  it("throws InvalidConfigurationError when lifespan is zero", async () => {
    const useCase = new IssueReceiptUseCase({
      signer: makeSigner(),
      tokenLifespanMinutes: 0,
      now: () => frozenNow,
    });
    await assert.rejects(
      () => useCase.execute(accountId),
      InvalidConfigurationError,
    );
  });

  it("throws InvalidConfigurationError when lifespan is negative", async () => {
    const useCase = new IssueReceiptUseCase({
      signer: makeSigner(),
      tokenLifespanMinutes: -5,
      now: () => frozenNow,
    });
    await assert.rejects(
      () => useCase.execute(accountId),
      InvalidConfigurationError,
    );
  });
});
