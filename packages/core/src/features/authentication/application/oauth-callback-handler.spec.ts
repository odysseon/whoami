import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { AuthenticationError } from "../../../shared/domain/errors/auth.error.js";
import { Receipt } from "../../receipts/domain/receipt.entity.js";
import { AuthenticateOAuthUseCase } from "./authenticate-oauth.usecase.js";
import { IssueReceiptUseCase } from "../../receipts/application/issue-receipt.usecase.js";
import { OAuthCallbackHandler } from "./oauth-callback-handler.js";

const ID = new AccountId("acc_1");
const EXPIRY = new Date(Date.now() + 3_600_000);
const TOKEN = "signed.token";

function fakeAuth(
  override?: Partial<{
    execute: typeof AuthenticateOAuthUseCase.prototype.execute;
  }>,
): AuthenticateOAuthUseCase {
  return {
    execute: async () => ID,
    ...override,
  } as unknown as AuthenticateOAuthUseCase;
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

describe("OAuthCallbackHandler", () => {
  it("returns a Receipt on success", async () => {
    const receipt = await new OAuthCallbackHandler(
      fakeAuth(),
      fakeIssue(),
    ).handle({
      email: "user@example.com",
      provider: "google",
      providerId: "sub-1",
    });
    assert.ok(receipt instanceof Receipt);
    assert.equal(receipt.token, TOKEN);
    assert.ok(receipt.accountId.equals(ID));
  });

  it("passes correct input to AuthenticateOAuthUseCase", async () => {
    let captured: unknown;
    await new OAuthCallbackHandler(
      fakeAuth({
        execute: async (i) => {
          captured = i;
          return ID;
        },
      }),
      fakeIssue(),
    ).handle({
      email: "user@example.com",
      provider: "google",
      providerId: "sub-1",
    });
    assert.deepEqual(captured, {
      rawEmail: "user@example.com",
      provider: "google",
      providerId: "sub-1",
    });
  });

  it("propagates AuthenticationError", async () => {
    await assert.rejects(
      () =>
        new OAuthCallbackHandler(
          fakeAuth({
            execute: async () => {
              throw new AuthenticationError();
            },
          }),
          fakeIssue(),
        ).handle({
          email: "user@example.com",
          provider: "google",
          providerId: "x",
        }),
      AuthenticationError,
    );
  });
});
