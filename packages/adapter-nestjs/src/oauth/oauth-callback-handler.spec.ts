import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  AccountId,
  AuthenticateOAuthUseCase,
  AuthenticationError,
  IssueReceiptUseCase,
  Receipt,
} from "@odysseon/whoami-core";
import { OAuthCallbackHandler } from "./oauth-callback-handler.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FIXED_ACCOUNT_ID = new AccountId("acc_oauth_1");
const FIXED_EXPIRY = new Date(Date.now() + 60 * 60 * 1000);
const FIXED_TOKEN = "signed.receipt.token";

function fakeAuthenticateOAuth(
  override?: Partial<{
    execute: typeof AuthenticateOAuthUseCase.prototype.execute;
  }>,
): AuthenticateOAuthUseCase {
  return {
    execute: async () => FIXED_ACCOUNT_ID,
    ...override,
  } as unknown as AuthenticateOAuthUseCase;
}

function fakeIssueReceipt(
  override?: Partial<{ execute: typeof IssueReceiptUseCase.prototype.execute }>,
): IssueReceiptUseCase {
  return {
    execute: async (accountId) =>
      Receipt.issue({
        token: FIXED_TOKEN,
        accountId,
        expiresAt: FIXED_EXPIRY,
        now: new Date(FIXED_EXPIRY.getTime() - 1000),
      }),
    ...override,
  } as unknown as IssueReceiptUseCase;
}

const validProfile = {
  email: "user@example.com",
  provider: "google",
  providerId: "google-sub-123",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("OAuthCallbackHandler", () => {
  it("returns a Receipt when both use cases succeed", async () => {
    const handler = new OAuthCallbackHandler(
      fakeAuthenticateOAuth(),
      fakeIssueReceipt(),
    );

    const receipt = await handler.handle(validProfile);

    assert.ok(receipt instanceof Receipt);
    assert.equal(receipt.token, FIXED_TOKEN);
    assert.ok(receipt.accountId.equals(FIXED_ACCOUNT_ID));
    assert.ok(receipt.expiresAt instanceof Date);
  });

  it("passes the correct input to AuthenticateOAuthUseCase", async () => {
    let captured: unknown;

    const handler = new OAuthCallbackHandler(
      fakeAuthenticateOAuth({
        execute: async (input) => {
          captured = input;
          return FIXED_ACCOUNT_ID;
        },
      }),
      fakeIssueReceipt(),
    );

    await handler.handle(validProfile);

    assert.deepEqual(captured, {
      rawEmail: "user@example.com",
      provider: "google",
      providerId: "google-sub-123",
    });
  });

  it("passes the AccountId from authentication into IssueReceiptUseCase", async () => {
    let capturedId: unknown;

    const handler = new OAuthCallbackHandler(
      fakeAuthenticateOAuth(),
      fakeIssueReceipt({
        execute: async (accountId) => {
          capturedId = accountId;
          return Receipt.issue({
            token: FIXED_TOKEN,
            accountId,
            expiresAt: FIXED_EXPIRY,
            now: new Date(FIXED_EXPIRY.getTime() - 1000),
          });
        },
      }),
    );

    await handler.handle(validProfile);

    assert.ok((capturedId as AccountId).equals(FIXED_ACCOUNT_ID));
  });

  it("propagates AuthenticationError from AuthenticateOAuthUseCase", async () => {
    const handler = new OAuthCallbackHandler(
      fakeAuthenticateOAuth({
        execute: async () => {
          throw new AuthenticationError("OAuth provider mismatch.");
        },
      }),
      fakeIssueReceipt(),
    );

    await assert.rejects(
      () => handler.handle(validProfile),
      (err: unknown) => {
        assert.ok(err instanceof AuthenticationError);
        assert.equal(err.message, "OAuth provider mismatch.");
        return true;
      },
    );
  });

  it("propagates errors from IssueReceiptUseCase", async () => {
    const handler = new OAuthCallbackHandler(
      fakeAuthenticateOAuth(),
      fakeIssueReceipt({
        execute: async () => {
          throw new Error("Signer misconfigured.");
        },
      }),
    );

    await assert.rejects(
      () => handler.handle(validProfile),
      /Signer misconfigured\./,
    );
  });

  it("works with GitHub provider", async () => {
    let captured: unknown;

    const handler = new OAuthCallbackHandler(
      fakeAuthenticateOAuth({
        execute: async (input) => {
          captured = input;
          return FIXED_ACCOUNT_ID;
        },
      }),
      fakeIssueReceipt(),
    );

    await handler.handle({
      email: "dev@example.com",
      provider: "github",
      providerId: "12345678",
    });

    assert.deepEqual(captured, {
      rawEmail: "dev@example.com",
      provider: "github",
      providerId: "12345678",
    });
  });
});
