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
 * Port for cryptographically secure token operations.
 * Implemented by infrastructure adapters (e.g., WebCrypto, Node crypto).
 *
 * Core must never call Web Crypto globals directly — this port is the
 * zone boundary that keeps the kernel platform-agnostic.
 */
export interface SecureTokenPort {
  /**
   * Generates a cryptographically secure random token.
   * @returns A base64url-encoded token with at least 256 bits of entropy.
   */
  generateToken(): string;

  /**
   * Hashes a token with SHA-256.
   * @param token - The plaintext token to hash.
   * @returns A base64url-encoded SHA-256 digest.
   */
  hashToken(token: string): Promise<string>;
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
