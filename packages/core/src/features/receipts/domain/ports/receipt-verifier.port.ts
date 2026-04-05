import { Receipt } from "../receipt.entity.js";

/**
 * Verifies signed receipt tokens and restores their metadata.
 *
 * Implement this port in your infrastructure layer using the same algorithm
 * as {@link ReceiptSigner} (e.g. RS256 JWT verification).
 *
 * @public
 */
export interface ReceiptVerifier {
  /**
   * Verifies a signed receipt token and reconstructs its {@link Receipt}.
   *
   * @param token - The opaque signed token string.
   * @returns The verified {@link Receipt} with account ID and expiry restored.
   * @throws {InvalidReceiptError} When the token is expired, tampered, or otherwise invalid.
   */
  verify(token: string): Promise<Receipt>;
}
