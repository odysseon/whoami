import type { AccountId } from "../../shared/index.js";

/**
 * Signs receipt tokens for authenticated accounts.
 * Implement with RS256 JWT or equivalent.
 * @public
 */
export interface ReceiptSigner {
  sign(accountId: AccountId, expiresAt: Date): Promise<string>;
}
