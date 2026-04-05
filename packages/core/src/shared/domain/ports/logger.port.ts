/**
 * Minimal structured logger abstraction used throughout the use-case layer.
 *
 * Pass any logger that implements this interface — `console`, `pino`, `winston`,
 * NestJS `Logger`, etc.  The library never writes to `console` directly.
 *
 * @public
 */
export interface LoggerPort {
  /**
   * Logs an informational message.
   *
   * @param message - The primary log message or object.
   * @param meta    - Optional additional context values.
   */
  info(message: unknown, ...meta: unknown[]): void;

  /**
   * Logs a warning message.
   *
   * @param message - The primary log message or object.
   * @param meta    - Optional additional context values.
   */
  warn(message: unknown, ...meta: unknown[]): void;

  /**
   * Logs an error message.
   *
   * @param message - The primary log message or object.
   * @param trace   - Optional stack trace string.
   * @param meta    - Optional additional context values.
   */
  error(message: unknown, trace?: string, ...meta: unknown[]): void;
}
