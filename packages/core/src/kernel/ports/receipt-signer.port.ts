import type { Receipt } from "../domain/entities/receipt.js";
import type { AccountId } from "../domain/value-objects/index.js";

/**
 * Port for signing authentication receipts.
 * Implemented by infrastructure adapters (e.g., JWT libraries).
 */
export interface ReceiptSigner {
  /**
   * Signs an account ID and expiration time to create a receipt token
   * @param accountId - The account ID to sign
   * @param expiresAt - When the receipt expires
   * @returns A receipt containing the signed token
   */
  sign(accountId: AccountId, expiresAt: Date): Promise<Receipt>;
}

/**
 * Port for verifying authentication receipts.
 * Implemented by infrastructure adapters (e.g., JWT libraries).
 */
export interface ReceiptVerifier {
  /**
   * Verifies a receipt token
   * @param token - The token to verify
   * @returns The verified receipt
   * @throws InvalidReceiptError if the token is invalid or expired
   */
  verify(token: string): Promise<Receipt>;
}
