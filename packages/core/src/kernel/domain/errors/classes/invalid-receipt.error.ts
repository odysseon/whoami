import { DomainError } from "../domain-error.js";

/**
 * Thrown when receipt token is empty, expired, or fails signature verification
 */
export class InvalidReceiptError extends DomainError {
  readonly code = "INVALID_RECEIPT";
  readonly statusCode = 401;

  constructor(message: string = "Invalid receipt") {
    super(message);
  }
}
