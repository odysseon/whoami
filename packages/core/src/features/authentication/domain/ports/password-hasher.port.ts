/**
 * Hashes and verifies password secrets.
 */
export interface PasswordHasher {
  /**
   * Compares a plain-text password to a stored hash.
   *
   * @param plainText - The password supplied by the client.
   * @param hash - The persisted password hash.
   * @returns `true` when the password matches the hash.
   */
  compare(plainText: string, hash: string): Promise<boolean>;

  /**
   * Creates a password hash.
   *
   * @param plainText - The password to hash.
   * @returns The generated password hash.
   */
  hash(plainText: string): Promise<string>;
}
