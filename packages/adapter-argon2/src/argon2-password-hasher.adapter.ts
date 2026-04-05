import * as argon2 from "argon2";
import type { PasswordManager } from "@odysseon/whoami-core";

/**
 * Argon2-based password hasher for password credentials.
 */
export class Argon2PasswordHasher implements PasswordManager {
  constructor(private readonly options?: argon2.Options) {}
  /**
   * Hashes a plain-text password.
   *
   * @param plainText - The password to hash.
   * @returns The generated Argon2 hash.
   */
  public async hash(plainText: string): Promise<string> {
    if (!plainText) {
      throw new Error("Cannot hash an empty password.");
    }

    return await argon2.hash(plainText, this.options);
  }

  /**
   * Compares a plain-text password against a stored Argon2 hash.
   *
   * @param plainText - The password supplied by the client.
   * @param hash - The persisted Argon2 hash.
   * @returns `true` when the password matches the hash.
   */
  public async compare(plainText: string, hash: string): Promise<boolean> {
    if (!hash || !plainText) {
      return false;
    }

    try {
      return await argon2.verify(hash, plainText);
    } catch {
      return false;
    }
  }
}
