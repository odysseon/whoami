import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { InvalidConfigurationError } from "../../../shared/domain/errors/validation.error.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { IssueReceiptUseCase } from "./issue-receipt.usecase.js";

describe("IssueReceiptUseCase", () => {
  it("uses one computed expiry for signing and the returned receipt", async () => {
    // Use a stable reference date
    const now = new Date();
    // Set to a fixed time to ensure consistency
    now.setUTCHours(10, 0, 0, 0);

    const accountId = new AccountId("acc_1");
    let signedExpiresAt: Date | undefined;
    const useCase = new IssueReceiptUseCase(
      {
        sign: async (_accountId, expiresAt): Promise<string> => {
          signedExpiresAt = expiresAt;
          return "signed-token";
        },
      },
      30,
      () => now,
    );

    const receipt = await useCase.execute(accountId);

    const expectedExpiry = new Date(now.getTime());
    expectedExpiry.setMinutes(expectedExpiry.getMinutes() + 30);

    assert.equal(receipt.token, "signed-token");
    assert.equal(receipt.accountId.value, "acc_1");
    assert.ok(signedExpiresAt);
    assert.equal(
      receipt.expiresAt.toISOString(),
      signedExpiresAt?.toISOString(),
    );
    assert.equal(receipt.expiresAt.toISOString(), expectedExpiry.toISOString());
  });

  it("rejects non-positive token lifespans", async () => {
    const useCase = new IssueReceiptUseCase(
      {
        sign: async (): Promise<string> => "signed-token",
      },
      0,
    );

    await assert.rejects(
      () => useCase.execute(new AccountId("acc_2")),
      InvalidConfigurationError,
    );
  });
});
