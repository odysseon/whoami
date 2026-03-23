/**
 * Distinct from the Password Hasher.
 * This is used for fast, secure hashing of refresh tokens (e.g., SHA-256)
 * before storing them in the database to prevent replay attacks.
 */
export interface ITokenHasher {
  hash(token: string): Promise<string>;
  verify(hash: string, token: string): Promise<boolean>;
}
