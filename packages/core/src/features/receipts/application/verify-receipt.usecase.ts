import { InvalidReceiptError } from "../../../shared/domain/errors/auth.error.js";
import { Receipt } from "../domain/receipt.entity.js";
import type { ReceiptVerifier } from "../domain/ports/receipt-verifier.port.js";

/**
 * Verifies a signed receipt token and restores its {@link Receipt} metadata.
 *
 * Acts as a thin guard that rejects obviously empty tokens before delegating
 * to the configured {@link ReceiptVerifier} implementation.
 *
 * @public
 */
export class VerifyReceiptUseCase {
  private readonly verifier: ReceiptVerifier;

  /** @param verifier - The receipt verifier implementation to delegate to. */
  constructor(verifier: ReceiptVerifier) {
    this.verifier = verifier;
  }

  /**
   * Verifies the supplied token and returns the corresponding {@link Receipt}.
   *
   * @param token - The signed receipt token to verify.
   * @returns The verified {@link Receipt} with account ID and expiry restored.
   * @throws {InvalidReceiptError} When `token` is empty, expired, or fails signature verification.
   */
  public async execute(token: string): Promise<Receipt> {
    if (!token || token.trim() === "") {
      throw new InvalidReceiptError("Receipt token is required.");
    }
    return await this.verifier.verify(token);
  }
}
