import { DomainError } from "../domain-error.js";

/**
 * Thrown when a use case looks up an account by ID and finds none
 */
export class AccountNotFoundError extends DomainError {
  readonly code = "ACCOUNT_NOT_FOUND";
  readonly statusCode = 404;

  constructor(accountId: string) {
    super(`Account not found: ${accountId}`);
  }
}
