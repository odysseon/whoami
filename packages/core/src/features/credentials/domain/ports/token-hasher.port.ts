/**
 * Produces deterministic, non-salted hashes for opaque tokens.
 *
 * Unlike {@link PasswordManager}, token hashing must be reproducible so that a
 * stored hash can be compared against a candidate token on every request
 * (e.g. magic-link tokens, API keys).  Use a fast, collision-resistant
 * algorithm such as SHA-256.
 *
 * @public
 */
export interface TokenHasher {
  /**
   * Produces a deterministic hash of the supplied token.
   *
   * The same `token` value must always produce the same output.
   *
   * @param token - The raw token string to hash.
   * @returns A hex-encoded hash string suitable for persistent storage.
   */
  hash(token: string): Promise<string>;
}
