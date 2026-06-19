import { DomainError, type DomainErrorCategory } from "../domain-error.js";

/**
 * Thrown when removing the last auth method would lock the account permanently
 */
export class CannotRemoveLastCredentialError extends DomainError {
  readonly code = "CANNOT_REMOVE_LAST_CREDENTIAL";
  readonly category: DomainErrorCategory = "UNPROCESSABLE";

  constructor() {
    super("Cannot remove the last credential from an account");
  }
}
