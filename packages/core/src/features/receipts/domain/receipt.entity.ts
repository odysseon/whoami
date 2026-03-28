import { InvalidReceiptError } from "../../../shared/index.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";

export class Receipt {
  private constructor(
    public readonly token: string,
    public readonly accountId: AccountId,
    public readonly expiresAt: Date,
  ) {}

  /**
   * Factory for minting a BRAND NEW receipt token.
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
    if (!token || token.trim() === "") {
      throw new InvalidReceiptError("Token payload cannot be empty.");
    }

    if (!expiresAt || expiresAt <= new Date()) {
      throw new InvalidReceiptError("Expiration date cannot be in the past.");
    }

    return new Receipt(token, accountId, expiresAt);
  }

  /**
   * Factory for rehydrating an EXISTING receipt token (e.g., during verification).
   * Bypasses the "creation" business rules since the token already exists.
   */
  public static loadExisting(
    token: string,
    accountId: AccountId,
    expiresAt: Date,
  ): Receipt {
    return new Receipt(token, accountId, expiresAt);
  }
}
