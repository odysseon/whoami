import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { AuthenticationError } from "../../../shared/domain/errors/auth.error.js";
import { Receipt } from "../../receipts/domain/receipt.entity.js";
import { VerifyMagicLinkUseCase } from "./verify-magic-link.usecase.js";
import { IssueReceiptUseCase } from "../../receipts/application/issue-receipt.usecase.js";
import { MagicLinkCallbackHandler } from "./magic-link-callback-handler.js";

const ID = new AccountId("acc_1");
const EXPIRY = new Date(Date.now() + 3_600_000);
const TOKEN = "signed.token";
const NOW = new Date("2026-03-27T10:00:00.000Z");

function fakeVerify(
  override?: Partial<{
    execute: typeof VerifyMagicLinkUseCase.prototype.execute;
  }>,
): VerifyMagicLinkUseCase {
  return {
    execute: async () => ID,
    ...override,
  } as unknown as VerifyMagicLinkUseCase;
}

function fakeIssue(
  override?: Partial<{ execute: typeof IssueReceiptUseCase.prototype.execute }>,
): IssueReceiptUseCase {
  return {
    execute: async (accountId) =>
      Receipt.issue({
        token: TOKEN,
        accountId,
        expiresAt: EXPIRY,
        now: new Date(EXPIRY.getTime() - 1000),
      }),
    ...override,
  } as unknown as IssueReceiptUseCase;
}

describe("MagicLinkCallbackHandler", () => {
  it("returns a Receipt on success", async () => {
    const receipt = await new MagicLinkCallbackHandler(
      fakeVerify(),
      fakeIssue(),
    ).handle({ email: "user@example.com", token: "hashed", currentTime: NOW });
    assert.ok(receipt instanceof Receipt);
    assert.equal(receipt.token, TOKEN);
    assert.ok(receipt.accountId.equals(ID));
  });

  it("passes correct input to VerifyMagicLinkUseCase", async () => {
    let captured: unknown;
    await new MagicLinkCallbackHandler(
      fakeVerify({
        execute: async (i) => {
          captured = i;
          return ID;
        },
      }),
      fakeIssue(),
    ).handle({ email: "user@example.com", token: "hashed", currentTime: NOW });
    assert.deepEqual(captured, {
      rawEmail: "user@example.com",
      token: "hashed",
      currentTime: NOW,
    });
  });

  it("propagates AuthenticationError", async () => {
    await assert.rejects(
      () =>
        new MagicLinkCallbackHandler(
          fakeVerify({
            execute: async () => {
              throw new AuthenticationError("Invalid or expired magic link.");
            },
          }),
          fakeIssue(),
        ).handle({ email: "user@example.com", token: "bad", currentTime: NOW }),
      AuthenticationError,
    );
  });
});
