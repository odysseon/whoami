import { HasId } from "./user.interface.js";

/**
 * Represents a tracked session token in the database.
 */
export interface IRefreshToken {
  id: HasId["id"];
  userId: HasId["id"];
  tokenHash: string;
  expiresAt: Date;
  isRevoked: boolean;
}

export type IStoreRefreshToken = Omit<IRefreshToken, "id">;
