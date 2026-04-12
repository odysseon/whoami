import type { Receipt } from "../receipt.entity.js";

/**
 * Verifies and decodes a signed receipt token.
 * @public
 */
export interface ReceiptVerifier {
  verify(token: string): Promise<Receipt>;
}
