import { DomainError } from "../domain-error.js";

/**
 * Thrown when constructing CredentialId with an empty value
 */
export class InvalidCredentialIdError extends DomainError {
  readonly code = "INVALID_CREDENTIAL_ID";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
