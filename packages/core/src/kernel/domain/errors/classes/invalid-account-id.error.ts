import { DomainError, type DomainErrorCategory } from "../domain-error.js";

/**
 * Thrown when constructing AccountId with an empty value
 */
export class InvalidAccountIdError extends DomainError {
  readonly code = "INVALID_ACCOUNT_ID";
  readonly category: DomainErrorCategory = "BAD_REQUEST";

  constructor(message: string) {
    super(message);
  }
}
