/**
 * Wall-clock port for deterministic time access.
 * Defaults to `() => new Date()` in production; override in tests.
 * @public
 */
export type ClockPort = () => Date;
