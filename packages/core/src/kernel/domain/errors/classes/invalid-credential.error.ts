import { DomainError, type DomainErrorCategory } from "../domain-error.js";

/**
 * Thrown when a credential factory receives an empty proof field
 */
export class InvalidCredentialError extends DomainError {
  readonly code = "INVALID_CREDENTIAL";
  readonly category: DomainErrorCategory = "BAD_REQUEST";

  constructor(message: string) {
    super(message);
  }
}
