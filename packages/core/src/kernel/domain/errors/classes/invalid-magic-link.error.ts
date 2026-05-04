import { DomainError } from "../domain-error.js";

/**
 * Thrown when a magic link token is invalid or expired
 */
export class InvalidMagicLinkError extends DomainError {
  readonly code = "INVALID_MAGIC_LINK";
  readonly statusCode = 400;

  constructor(message: string = "Invalid or expired magic link") {
    super(message);
  }
}
