import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";

/**
 * Represents a signed receipt token and its expiry metadata.
 */
export class Receipt {
  private constructor(
    public readonly token: string,
    public readonly accountId: AccountId,
    public readonly expiresAt: Date,
  ) {}

  /**
   * Creates a receipt from a signed token and explicit expiry time.
   *
   * @param token - The signed token.
   * @param accountId - The account bound to the token.
   * @param expiresAt - The exact token expiry time.
   * @returns A receipt instance.
   */
  public static issue(
    token: string,
    accountId: AccountId,
    expiresAt: Date,
  ): Receipt {
    return new Receipt(token, accountId, new Date(expiresAt.getTime()));
  }
}
