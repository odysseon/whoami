import { DomainError } from "../domain-error.js";

/**
 * Thrown when attempting to add a password to an account that already has one
 */
export class CredentialAlreadyExistsError extends DomainError {
  readonly code = "CREDENTIAL_ALREADY_EXISTS";
  readonly statusCode = 409;

  constructor(message: string) {
    super(message);
  }
}
