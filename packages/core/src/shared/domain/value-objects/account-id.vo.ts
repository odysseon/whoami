import { DomainError } from "../errors/domain.error.js";

export class InvalidAccountIdError extends DomainError {
  constructor() {
    super("AccountId cannot be empty.");
  }
}

export class AccountId {
  public readonly value: string | number;

  constructor(raw: string | number) {
    if (raw === undefined || raw === null || String(raw).trim() === "") {
      throw new InvalidAccountIdError();
    }
    this.value = raw;
  }

  public equals(other: AccountId): boolean {
    return this.value === other.value;
  }
}
