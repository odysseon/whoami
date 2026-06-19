import { DomainError, type DomainErrorCategory } from "../domain-error.js";

/**
 * Thrown when a password reset token is invalid or expired
 */
export class InvalidResetTokenError extends DomainError {
  readonly code = "INVALID_RESET_TOKEN";
  readonly category: DomainErrorCategory = "BAD_REQUEST";

  constructor(message: string = "Invalid or expired reset token") {
    super(message);
  }
}
