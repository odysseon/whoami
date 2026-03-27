import { AccountId } from "src/shared/index.js";
import { ReceiptSigner } from "../domain/ports/receipt-signer.port.js";
import { Receipt } from "../domain/receipt.entity.js";

export class IssueReceiptUseCase {
  constructor(
    private readonly signer: ReceiptSigner,
    private readonly tokenLifespanMinutes: number = 60,
  ) {}

  public async execute(accountId: AccountId): Promise<Receipt> {
    // 1. Ask the external port to do the messy cryptographic signing
    const signedToken = await this.signer.sign(accountId);

    // 2. Package it up into our pure domain model
    return Receipt.issue(signedToken, accountId, this.tokenLifespanMinutes);
  }
}
