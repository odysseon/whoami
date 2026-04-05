import { AccountId } from "../../../../shared/domain/value-objects/account-id.vo.js";

/**
 * Signs receipt tokens for authenticated accounts.
 *
 * Implement this port in your infrastructure layer using a suitable signing
 * algorithm (e.g. RS256 JWT via `@odysseon/adapter-jose`).
 *
 * @public
 */
export interface ReceiptSigner {
  /**
   * Produces a signed token encoding the account identity and expiry.
   *
   * @param accountId - The authenticated account identifier.
   * @param expiresAt - The exact UTC expiry time to embed in the token.
   * @returns The opaque signed token string.
   */
  sign(accountId: AccountId, expiresAt: Date): Promise<string>;
}
