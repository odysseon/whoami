export interface LoggerPort {
  info(message: unknown, ...meta: unknown[]): void;
  warn(message: unknown, ...meta: unknown[]): void;
  error(message: unknown, trace?: string, ...meta: unknown[]): void;
}
