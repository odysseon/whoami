export type DomainErrorCategory =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE"
  | "INTERNAL";

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
   * Transport-agnostic categorization of the error
   */
  abstract readonly category: DomainErrorCategory;

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
      category: this.category,
    };
  }
}
