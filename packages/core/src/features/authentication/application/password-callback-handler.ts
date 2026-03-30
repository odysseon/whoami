import { Receipt } from "../../receipts/domain/receipt.entity.js";
import { IssueReceiptUseCase } from "../../receipts/application/issue-receipt.usecase.js";
import { VerifyPasswordUseCase } from "./verify-password.usecase.js";

export interface PasswordLoginInput {
  email: string;
  plainTextPassword: string;
}

/**
 * Composes `VerifyPasswordUseCase` + `IssueReceiptUseCase` into one call.
 * Framework-agnostic — no NestJS or Express dependencies.
 */
export class PasswordCallbackHandler {
  constructor(
    private readonly verifyPassword: VerifyPasswordUseCase,
    private readonly issueReceipt: IssueReceiptUseCase,
  ) {}

  public async handle(input: PasswordLoginInput): Promise<Receipt> {
    const accountId = await this.verifyPassword.execute({
      rawEmail: input.email,
      plainTextPassword: input.plainTextPassword,
    });
    return await this.issueReceipt.execute(accountId);
  }
}
