import { DomainError } from "../domain-error.js";

/**
 * Thrown when constructing AccountId with an empty value
 */
export class InvalidAccountIdError extends DomainError {
  readonly code = "INVALID_ACCOUNT_ID";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
