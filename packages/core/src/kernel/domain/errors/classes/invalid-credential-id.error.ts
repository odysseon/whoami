import { DomainError, type DomainErrorCategory } from "../domain-error.js";

/**
 * Thrown when constructing CredentialId with an empty value
 */
export class InvalidCredentialIdError extends DomainError {
  readonly code = "INVALID_CREDENTIAL_ID";
  readonly category: DomainErrorCategory = "BAD_REQUEST";

  constructor(message: string) {
    super(message);
  }
}
