import type {
  IRefreshToken,
  IStoreRefreshToken,
} from "../../models/refresh-token.interface.js";

export interface IRefreshTokenRepository {
  /**
   * Persists a new refresh token to the database.
   */
  store(token: IStoreRefreshToken): Promise<void>;

  /**
   * Retrieves a token by its deterministic hash without altering its state.
   * Used to explicitly inspect the token (e.g., checking expiration or revocation) before rotation.
   */
  findByHash(tokenHash: string): Promise<IRefreshToken | null>;

  /**
   * ATOMIC ROTATION: This is the most critical security method.
   * It must find the old token by its hash, delete it (or mark it consumed),
   * AND insert the new token data in a SINGLE database transaction.
   * * @returns true if the rotation succeeded, false if the old token was no longer valid/available (indicating a race condition or token reuse).
   */
  rotate(oldTokenHash: string, newData: IStoreRefreshToken): Promise<boolean>;

  revokeAllForUser(userId: string): Promise<void>;
}
