import { DomainError, type DomainErrorCategory } from "../domain-error.js";

/**
 * Thrown when constructing EmailAddress with an invalid value
 */
export class InvalidEmailError extends DomainError {
  readonly code = "INVALID_EMAIL";
  readonly category: DomainErrorCategory = "BAD_REQUEST";

  constructor(message: string) {
    super(message);
  }
}
