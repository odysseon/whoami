import {
  AccountId,
  EmailAddress,
} from "../../../shared/domain/value-objects/index.js";

/**
 * Represents a registered account.
 */
export class Account {
  public readonly id: AccountId;
  public readonly email: EmailAddress;

  private constructor(id: AccountId, email: EmailAddress) {
    this.id = id;
    this.email = email;
  }

  /**
   * Creates a new account aggregate.
   *
   * @param id - The account identifier.
   * @param email - The normalized account email address.
   * @returns A new account instance.
   */
  public static create(id: AccountId, email: EmailAddress): Account {
    return new Account(id, email);
  }
}
