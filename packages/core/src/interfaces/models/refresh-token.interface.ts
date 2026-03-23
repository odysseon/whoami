/**
 * Represents a tracked session token in the database.
 */
export interface IRefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  isRevoked: boolean;
}
