import { Receipt } from "../receipt.entity.js";

/**
 * Verifies signed receipt tokens and restores receipt metadata.
 */
export interface ReceiptVerifier {
  /**
   * Verifies a signed receipt token.
   *
   * @param token - The signed receipt token.
   * @returns The verified receipt metadata.
   */
  verify(token: string): Promise<Receipt>;
}
