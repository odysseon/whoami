import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { AuthenticationError } from "../../../shared/domain/errors/auth.error.js";
import { Receipt } from "../../receipts/domain/receipt.entity.js";
import { VerifyPasswordUseCase } from "./verify-password.usecase.js";
import { IssueReceiptUseCase } from "../../receipts/application/issue-receipt.usecase.js";
import { PasswordCallbackHandler } from "./password-callback-handler.js";

const ID = new AccountId("acc_1");
const EXPIRY = new Date(Date.now() + 3_600_000);
const TOKEN = "signed.token";

function fakeVerify(
  override?: Partial<{
    execute: typeof VerifyPasswordUseCase.prototype.execute;
  }>,
): VerifyPasswordUseCase {
  return {
    execute: async () => ID,
    ...override,
  } as unknown as VerifyPasswordUseCase;
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

describe("PasswordCallbackHandler", () => {
  it("returns a Receipt on success", async () => {
    const receipt = await new PasswordCallbackHandler(
      fakeVerify(),
      fakeIssue(),
    ).handle({ email: "user@example.com", plainTextPassword: "secret" });
    assert.ok(receipt instanceof Receipt);
    assert.equal(receipt.token, TOKEN);
    assert.ok(receipt.accountId.equals(ID));
  });

  it("passes correct input to VerifyPasswordUseCase", async () => {
    let captured: unknown;
    await new PasswordCallbackHandler(
      fakeVerify({
        execute: async (i) => {
          captured = i;
          return ID;
        },
      }),
      fakeIssue(),
    ).handle({ email: "user@example.com", plainTextPassword: "secret" });
    assert.deepEqual(captured, {
      rawEmail: "user@example.com",
      plainTextPassword: "secret",
    });
  });

  it("propagates AuthenticationError", async () => {
    await assert.rejects(
      () =>
        new PasswordCallbackHandler(
          fakeVerify({
            execute: async () => {
              throw new AuthenticationError();
            },
          }),
          fakeIssue(),
        ).handle({ email: "user@example.com", plainTextPassword: "wrong" }),
      AuthenticationError,
    );
  });
});
