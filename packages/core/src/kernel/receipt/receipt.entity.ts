import { AccountId, InvalidReceiptError } from "../shared/index.js";

export interface ReceiptIssuanceInput {
  token: string;
  accountId: AccountId;
  expiresAt: Date;
  now: Date;
}

/**
 * Signed, time-bounded proof of successful authentication.
 * Immutable. Use {@link Receipt.issue} to mint; {@link Receipt.loadExisting} to rehydrate.
 * @public
 */
export class Receipt {
  public readonly token: string;
  public readonly accountId: AccountId;
  public readonly expiresAt: Date;

  private constructor(token: string, accountId: AccountId, expiresAt: Date) {
    this.token = token;
    this.accountId = accountId;
    this.expiresAt = expiresAt;
  }

  public static issue(input: ReceiptIssuanceInput): Receipt {
    if (!input.token || input.token.trim() === "")
      throw new InvalidReceiptError("Token payload cannot be empty.");
    if (!input.expiresAt || input.expiresAt <= input.now)
      throw new InvalidReceiptError("Expiration date must be in the future.");
    return new Receipt(input.token, input.accountId, input.expiresAt);
  }

  public static loadExisting(
    token: string,
    props: { accountId: AccountId; expiresAt: Date },
  ): Receipt {
    return new Receipt(token, props.accountId, props.expiresAt);
  }
}
