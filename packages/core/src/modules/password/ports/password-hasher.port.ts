/**
 * Password hashing port — owned by the password module.
 * Implement with bcrypt, argon2, or equivalent.
 * @public
 */
export interface PasswordHasher {
  hash(plainText: string): Promise<string>;
  compare(plainText: string, hash: string): Promise<boolean>;
}
