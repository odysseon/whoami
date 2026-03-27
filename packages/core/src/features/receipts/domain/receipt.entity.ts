import { AccountId } from "src/shared/index.js";

export class Receipt {
  private constructor(
    public readonly token: string,
    public readonly accountId: AccountId,
    public readonly expiresAt: Date,
  ) {}

  public static issue(
    token: string,
    accountId: AccountId,
    expiresInMinutes: number,
  ): Receipt {
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + expiresInMinutes);

    return new Receipt(token, accountId, expiration);
  }
}
