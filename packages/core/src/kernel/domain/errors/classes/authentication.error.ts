import { DomainError } from "../domain-error.js";

/**
 * Thrown when credential verification fails
 * Intentionally vague to prevent enumeration attacks
 */
export class AuthenticationError extends DomainError {
  readonly code = "AUTHENTICATION_ERROR";
  readonly statusCode = 401;

  constructor(message: string = "Authentication failed") {
    super(message);
  }
}
