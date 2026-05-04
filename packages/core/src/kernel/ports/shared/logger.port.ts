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
