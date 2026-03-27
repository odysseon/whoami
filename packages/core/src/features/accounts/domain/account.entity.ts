import { AccountId, EmailAddress } from "src/shared/domain/types.js";

export class Account {
  private constructor(
    public readonly id: AccountId,
    public readonly email: EmailAddress,
  ) {}

  public static create(id: AccountId, email: EmailAddress): Account {
    return new Account(id, email);
  }
}
