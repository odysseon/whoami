import {
  AccountId,
  EmailAddress,
} from "../../../shared/domain/value-objects/index.js";

/**
 * Represents a registered account.
 */
export class Account {
  private constructor(
    public readonly id: AccountId,
    public readonly email: EmailAddress,
  ) {}

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

  /**
   * Reconstructs an existing account aggregate from persisted data.
   *
   * @param id - The account identifier.
   * @param email - The normalized account email address.
   * @returns An account instance representing the existing data.
   */
  public static loadExisting(id: AccountId, email: EmailAddress): Account {
    return new Account(id, email);
  }
}
