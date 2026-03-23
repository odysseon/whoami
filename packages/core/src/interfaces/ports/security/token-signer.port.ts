import type { IJwtPayload } from "../../models/jwt-payload.interface.js";

export interface ITokenSigner {
  /**
   * Signs a payload into a JWT string.
   */
  sign(payload: IJwtPayload, expiresInSeconds: number): Promise<string>;

  /**
   * Verifies a JWT string and extracts its payload.
   * Should throw a WhoamiError if expired or malformed.
   */
  verify(token: string): Promise<IJwtPayload>;
}
