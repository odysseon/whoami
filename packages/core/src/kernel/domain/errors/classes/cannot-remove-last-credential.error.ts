import { DomainError } from "../domain-error.js";

/**
 * Thrown when removing the last auth method would lock the account permanently
 */
export class CannotRemoveLastCredentialError extends DomainError {
  readonly code = "CANNOT_REMOVE_LAST_CREDENTIAL";
  readonly statusCode = 400;

  constructor() {
    super("Cannot remove the last credential from an account");
  }
}
