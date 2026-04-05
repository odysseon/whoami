import { DomainError } from "./domain.error.js";

/**
 * Thrown when an email address string fails format validation inside
 * {@link EmailAddress}.
 *
 * @public
 */
export class InvalidEmailError extends DomainError {
  public override readonly code = "INVALID_EMAIL" as const;

  constructor() {
    super("The provided email address format is invalid.");
  }
}

/**
 * Thrown when a required configuration value is missing, zero, or out of the
 * accepted range (e.g. a non-positive token lifespan).
 *
 * @public
 */
export class InvalidConfigurationError extends DomainError {
  public override readonly code = "INVALID_CONFIGURATION" as const;

  /** @param message - Description of which configuration value is invalid and why. */
  constructor(message: string) {
    super(message);
  }
}

/**
 * Thrown when a {@link Credential} factory receives an empty or blank proof
 * field (hash, token, provider, or providerId).
 *
 * @public
 */
export class InvalidCredentialError extends DomainError {
  public override readonly code = "INVALID_CREDENTIAL" as const;

  /** @param message - Description of which field is invalid. */
  constructor(message: string) {
    super(message);
  }
}
