/**
 * Port for logging operations.
 * Implemented by infrastructure adapters.
 */
export interface LoggerPort {
  /**
   * Logs an informational message
   * @param message - The message to log
   * @param meta - Optional metadata
   */
  info(message: string, meta?: Record<string, unknown>): void;

  /**
   * Logs a warning message
   * @param message - The message to log
   * @param meta - Optional metadata
   */
  warn(message: string, meta?: Record<string, unknown>): void;

  /**
   * Logs an error message
   * @param message - The message to log
   * @param meta - Optional metadata
   */
  error(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Port for ID generation.
 * Implemented by infrastructure adapters (e.g., UUID generators).
 */
export interface IdGeneratorPort {
  /**
   * Generates a unique ID
   * @returns A unique string ID
   */
  generate(): string;
}

/**
 * Port for time operations.
 * Implemented by infrastructure adapters (useful for testing).
 */
export interface ClockPort {
  /**
   * Returns the current date and time
   * @returns The current date
   */
  now(): Date;
}
