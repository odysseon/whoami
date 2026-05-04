import { DomainError } from "../domain-error.js";

/**
 * Thrown when attempting to register an email that already has an account
 */
export class AccountAlreadyExistsError extends DomainError {
  readonly code = "ACCOUNT_ALREADY_EXISTS";
  readonly statusCode = 409;

  constructor(email: string) {
    super(`Account already exists for email: ${email}`);
  }
}
