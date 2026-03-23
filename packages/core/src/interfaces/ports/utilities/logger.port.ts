/**
 * A framework-agnostic logging contract.
 * Designed to be as ergonomic as `console.log` while remaining strictly typed.
 */
export interface ILogger {
  info(message: unknown, ...optionalParams: unknown[]): void;
  warn(message: unknown, ...optionalParams: unknown[]): void;

  // We keep error flexible too, as you might pass an Error object directly
  error(message: unknown, ...optionalParams: unknown[]): void;

  debug?(message: unknown, ...optionalParams: unknown[]): void;
}
