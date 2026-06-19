import { DomainError, type DomainErrorCategory } from "../domain-error.js";

/**
 * Thrown when removeAuthMethod is called for a method that is not configured
 */
export class UnsupportedAuthMethodError extends DomainError {
  readonly code = "UNSUPPORTED_AUTH_METHOD";
  readonly category: DomainErrorCategory = "BAD_REQUEST";

  constructor(method: string) {
    super(`Unsupported authentication method: ${method}`);
  }
}
