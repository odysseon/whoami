import { Receipt } from "../../receipts/domain/receipt.entity.js";
import { IssueReceiptUseCase } from "../../receipts/application/issue-receipt.usecase.js";
import { VerifyMagicLinkUseCase } from "./verify-magic-link.usecase.js";

export interface MagicLinkLoginInput {
  email: string;
  token: string;
  currentTime: Date;
}

/**
 * Composes `VerifyMagicLinkUseCase` + `IssueReceiptUseCase` into one call.
 * The magic-link token is invalidated on success (single-use enforcement).
 * Framework-agnostic — no NestJS or Express dependencies.
 */
export class MagicLinkCallbackHandler {
  constructor(
    private readonly verifyMagicLink: VerifyMagicLinkUseCase,
    private readonly issueReceipt: IssueReceiptUseCase,
  ) {}

  public async handle(input: MagicLinkLoginInput): Promise<Receipt> {
    const accountId = await this.verifyMagicLink.execute({
      rawEmail: input.email,
      token: input.token,
      currentTime: input.currentTime,
    });
    return await this.issueReceipt.execute(accountId);
  }
}
