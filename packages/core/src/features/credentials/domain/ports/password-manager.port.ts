/**
 * Hashes and verifies user passwords.
 *
 * Implement this port with a slow, salted algorithm such as bcrypt or argon2.
 * The library never receives or stores plain-text passwords — only the hash
 * produced by this port.
 *
 * @public
 */
export interface PasswordManager {
  /**
   * Compares a plain-text password against a stored hash.
   *
   * @param plainText - The password supplied by the client.
   * @param hash      - The hash previously produced by {@link PasswordManager.hash}.
   * @returns `true` when the password matches the hash, `false` otherwise.
   */
  compare(plainText: string, hash: string): Promise<boolean>;

  /**
   * Produces a salted hash of the given plain-text password.
   *
   * @param plainText - The password to hash.
   * @returns The generated hash string suitable for persistent storage.
   */
  hash(plainText: string): Promise<string>;
}
