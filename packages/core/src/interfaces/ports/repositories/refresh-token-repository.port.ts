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
   * ATOMIC CONSUMPTION: This is the most critical security method.
   * It must find the token by its hash, verify it is not revoked,
   * AND instantly delete or mark it as used in a single atomic transaction.
   * * Returns null if the token does not exist or was already consumed.
   */
  consume(tokenHash: string): Promise<IRefreshToken | null>;

  /**
   * Revokes all active refresh tokens for a specific user ID.
   * Useful for "Log out of all devices" functionality.
   */
  revokeAllForUser(userId: string): Promise<void>;
}
