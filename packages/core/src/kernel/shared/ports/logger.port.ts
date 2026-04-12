/**
 * Structured logging port.
 * Implement with any logger (pino, winston, console, etc.).
 * @public
 */
export interface LoggerPort {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}
