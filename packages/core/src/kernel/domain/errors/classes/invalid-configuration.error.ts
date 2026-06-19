import { DomainError, type DomainErrorCategory } from "../domain-error.js";

/**
 * Thrown when a use case is constructed with an invalid config value
 */
export class InvalidConfigurationError extends DomainError {
  readonly code = "INVALID_CONFIGURATION";
  readonly category: DomainErrorCategory = "INTERNAL";

  constructor(message: string) {
    super(message);
  }
}
