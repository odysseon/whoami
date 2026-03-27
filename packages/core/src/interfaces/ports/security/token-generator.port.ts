/**
 * Contract for generating secure, opaque, and unique tokens.
 * Used primarily for refresh tokens, email verification codes, or password resets.
 */
export interface ITokenGenerator {
  /**
   * Generates a unique string token.
   * @returns A secure random string (e.g., a UUID or high-entropy nanoid)
   */
  generate(): string;
}
