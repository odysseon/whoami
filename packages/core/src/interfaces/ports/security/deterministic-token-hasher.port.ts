/**
 * Distinct from the Password Hasher.
 * Must use a DETERMINISTIC hashing algorithm (e.g., SHA-256, HMAC).
 * Do NOT use salted algorithms like bcrypt or argon2 here, because
 * the service relies on hashing the raw token to look it up in the database.
 */
export interface IDeterministicTokenHasher {
  hash(token: string): Promise<string>;
  verify(hash: string, token: string): Promise<boolean>;
}
