import type { IGoogleIdentity } from "../../models/google-identity.interface.js";

export interface IGoogleIdTokenVerifier {
  /**
   * Verifies a Google-issued ID token and returns a normalized identity payload.
   * Should throw a WhoamiError if the token is invalid or malformed.
   */
  verify(idToken: string): Promise<IGoogleIdentity>;
}
