import { InvalidAccountIdError } from "../errors/domain.error.js";

/**
 * Branded identity for an account.
 * Wraps a UUID string and validates it is non-empty.
 * @public
 */
export class AccountId {
  public readonly value: string;

  constructor(value: string) {
    if (!value || value.trim() === "") {
      throw new InvalidAccountIdError("AccountId cannot be empty.");
    }
    this.value = value;
  }

  equals(other: AccountId): boolean {
    return this.value === other.value;
  }
}
