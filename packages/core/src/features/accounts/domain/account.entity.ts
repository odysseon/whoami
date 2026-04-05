import {
  AccountId,
  EmailAddress,
} from "../../../shared/domain/value-objects/index.js";

/**
 * The account aggregate root — the central identity record in the system.
 *
 * An account has exactly one email address and zero or more credentials.
 * It carries no authentication logic itself; that belongs in the credential
 * and receipt feature slices.
 *
 * Use {@link Account.create} to build new accounts.
 *
 * @public
 */
export class Account {
  /** The unique, stable account identifier. */
  public readonly id: AccountId;

  /** The normalized email address for this account. */
  public readonly email: EmailAddress;

  private constructor(id: AccountId, email: EmailAddress) {
    this.id = id;
    this.email = email;
  }

  /**
   * Creates a new account aggregate.
   *
   * @param id    - The unique account identifier (a UUID string).
   * @param email - The validated, normalized email address.
   * @returns A new {@link Account} instance.
   */
  public static create(id: AccountId, email: EmailAddress): Account {
    return new Account(id, email);
  }
}
