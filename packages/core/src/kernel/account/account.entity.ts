import { AccountId, EmailAddress } from "../shared/index.js";

/**
 * The account aggregate root — the central identity record.
 *
 * An account has exactly one email address. It carries no authentication logic.
 * @public
 */
export class Account {
  public readonly id: AccountId;
  public readonly email: EmailAddress;

  private constructor(id: AccountId, email: EmailAddress) {
    this.id = id;
    this.email = email;
  }

  public static create(id: AccountId, email: EmailAddress): Account {
    return new Account(id, email);
  }
}
