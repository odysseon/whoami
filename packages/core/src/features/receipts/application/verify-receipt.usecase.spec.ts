import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { InvalidReceiptError } from "../../../shared/domain/errors/auth.error.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { Receipt } from "../domain/receipt.entity.js";
import { VerifyReceiptUseCase } from "./verify-receipt.usecase.js";

describe("VerifyReceiptUseCase", () => {
  it("restores a verified receipt", async () => {
    const receipt = Receipt.issue(
      "signed-token",
      new AccountId("acc_1"),
      new Date("2026-03-27T11:00:00.000Z"),
    );
    const useCase = new VerifyReceiptUseCase({
      verify: async (): Promise<Receipt> => receipt,
    });

    const result = await useCase.execute("signed-token");

    assert.equal(result.token, "signed-token");
    assert.equal(result.accountId.value, "acc_1");
  });

  it("rejects empty receipt tokens", async () => {
    const useCase = new VerifyReceiptUseCase({
      verify: async (): Promise<Receipt> => {
        throw new Error("should not be called");
      },
    });

    await assert.rejects(() => useCase.execute("   "), InvalidReceiptError);
  });
});
