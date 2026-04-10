/**
 * Produces deterministic, non-salted hashes for opaque tokens.
 *
 * Unlike {@link PasswordManager}, token hashing must be reproducible so that a
 * stored hash can be compared against a candidate token on every request
 * (e.g. API keys, opaque session tokens).  Use a fast, collision-resistant
 * algorithm such as SHA-256.
 *
 * @remarks
 * This port is **not used internally** by `@odysseon/whoami-core` — it is
 * provided as a convenience contract for consumers who need deterministic token
 * hashing in their own application layers (e.g. storing hashed API keys).
 * `WebCryptoTokenHasher` from `@odysseon/whoami-adapter-webcrypto` implements
 * this port using the native `crypto.subtle` SHA-256 API.
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
