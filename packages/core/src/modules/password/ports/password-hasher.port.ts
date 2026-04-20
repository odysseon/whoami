/**
 * Port for password hashing operations.
 * Implemented by infrastructure adapters (e.g., Argon2, bcrypt).
 */
export interface PasswordHasher {
  /**
   * Hashes a plain text password
   * @param plainText - The plain text password
   * @returns The hashed password
   */
  hash(plainText: string): Promise<string>;

  /**
   * Compares a plain text password with a hash
   * @param plainText - The plain text password
   * @param hash - The hashed password
   * @returns True if the password matches
   */
  compare(plainText: string, hash: string): Promise<boolean>;
}
