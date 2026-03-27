import { InvalidReceiptError } from "../../../shared/domain/errors/auth.error.js";
import { Receipt } from "../domain/receipt.entity.js";
import type { ReceiptVerifier } from "../domain/ports/receipt-verifier.port.js";

/**
 * Verifies a signed receipt token and restores its receipt metadata.
 */
export class VerifyReceiptUseCase {
  constructor(private readonly verifier: ReceiptVerifier) {}

  /**
   * Verifies a signed receipt token.
   *
   * @param token - The signed receipt token.
   * @returns The verified receipt.
   * @throws {InvalidReceiptError} When the token is empty or invalid.
   */
  public async execute(token: string): Promise<Receipt> {
    if (!token.trim()) {
      throw new InvalidReceiptError("Receipt token is required.");
    }

    return await this.verifier.verify(token);
  }
}
