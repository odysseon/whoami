import { DomainError, type DomainErrorCategory } from "../domain-error.js";

/**
 * Thrown when receipt token is empty, expired, or fails signature verification
 */
export class InvalidReceiptError extends DomainError {
  readonly code = "INVALID_RECEIPT";
  readonly category: DomainErrorCategory = "UNAUTHORIZED";

  constructor(message: string = "Invalid receipt") {
    super(message);
  }
}
