import { InvalidReceiptError } from "../../shared/index.js";
import { Receipt } from "../receipt.entity.js";
import type { ReceiptVerifier } from "../ports/receipt-verifier.port.js";

/**
 * Verifies a signed receipt token and restores its {@link Receipt} metadata.
 * @public
 */
export class VerifyReceiptUseCase {
  private readonly verifier: ReceiptVerifier;

  constructor(verifier: ReceiptVerifier) {
    this.verifier = verifier;
  }

  public async execute(token: string): Promise<Receipt> {
    if (!token || token.trim() === "")
      throw new InvalidReceiptError("Receipt token is required.");
    return await this.verifier.verify(token);
  }
}
