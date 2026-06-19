import { DomainError, type DomainErrorCategory } from "../domain-error.js";

/**
 * Thrown when a use case looks up an account by ID and finds none
 */
export class AccountNotFoundError extends DomainError {
  readonly code = "ACCOUNT_NOT_FOUND";
  readonly category: DomainErrorCategory = "NOT_FOUND";

  constructor(accountId: string) {
    super(`Account not found: ${accountId}`);
  }
}
