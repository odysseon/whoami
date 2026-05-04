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
