import { AccountId } from "../../../../shared/domain/value-objects/account-id.vo.js";

/**
 * Signs receipt tokens for authenticated accounts.
 */
export interface ReceiptSigner {
  /**
   * Signs a receipt token for the supplied account and expiry time.
   *
   * @param accountId - The authenticated account identifier.
   * @param expiresAt - The exact token expiry time.
   * @returns The signed token.
   */
  sign(accountId: AccountId, expiresAt: Date): Promise<string>;
}
