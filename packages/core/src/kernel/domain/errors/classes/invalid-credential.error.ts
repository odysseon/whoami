import { DomainError } from "../domain-error.js";

/**
 * Thrown when a credential factory receives an empty proof field
 */
export class InvalidCredentialError extends DomainError {
  readonly code = "INVALID_CREDENTIAL";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
