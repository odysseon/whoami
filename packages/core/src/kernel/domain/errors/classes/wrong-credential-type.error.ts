import { DomainError } from "../domain-error.js";

/**
 * Thrown when accessing a proof field that doesn't match the credential's kind
 */
export class WrongCredentialTypeError extends DomainError {
  readonly code = "WRONG_CREDENTIAL_TYPE";
  readonly statusCode = 500;

  constructor(expected: string, actual: string) {
    super(`Expected credential kind '${expected}' but got '${actual}'`);
  }
}
