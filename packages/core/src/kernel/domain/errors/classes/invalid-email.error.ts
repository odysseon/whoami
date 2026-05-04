import { DomainError } from "../domain-error.js";

/**
 * Thrown when constructing EmailAddress with an invalid value
 */
export class InvalidEmailError extends DomainError {
  readonly code = "INVALID_EMAIL";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
