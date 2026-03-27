/**
 * Must use a DETERMINISTIC hashing algorithm (e.g., SHA-256, HMAC).
 * Do NOT use salted algorithms like bcrypt or argon2 here.
 */
export interface IDeterministicTokenHasher {
  hash(token: string): Promise<string>;
}
