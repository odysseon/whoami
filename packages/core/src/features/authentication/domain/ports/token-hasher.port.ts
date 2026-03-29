/**
 * Deterministically hashes opaque tokens (e.g. magic-link, API-key).
 *
 * Unlike password hashing, token hashing is non-salted and must be
 * reproducible so that a stored hash can be compared against a
 * candidate token on every request.
 */
export interface TokenHasher {
  /**
   * Produces a deterministic hash of the supplied token.
   *
   * @param token - The raw token value to hash.
   * @returns A hex-encoded hash string.
   */
  hash(token: string): Promise<string>;
}
