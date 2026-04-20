/**
 * Base class for all domain errors in the whoami system.
 * All domain errors have a stable code that can be used for programmatic handling.
 */
export abstract class DomainError extends Error {
  /**
   * Stable error code for programmatic handling
   */
  abstract readonly code: string;

  /**
   * HTTP status code suggestion for API responses
   */
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // Fix prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Converts the error to a JSON-serializable object
   */
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}
