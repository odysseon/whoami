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
