/**
 * The strict shape of the data encoded inside  access tokens.
 */
export interface IJwtPayload {
  sub: string; // Subject (The User ID)
  jti?: string; // JWT ID (For optional access token revocation)
  iat?: number; // Issued At
  exp?: number; // Expiration Time
  iss?: string; // Issuer
  aud?: string | string[]; // Audience

  // Allow for custom claims safely without resorting to `any`
  [key: string]: unknown;
}
