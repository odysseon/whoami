import { DomainError } from "../domain-error.js";

/**
 * Thrown when a use case is constructed with an invalid config value
 */
export class InvalidConfigurationError extends DomainError {
  readonly code = "INVALID_CONFIGURATION";
  readonly statusCode = 500;

  constructor(message: string) {
    super(message);
  }
}
