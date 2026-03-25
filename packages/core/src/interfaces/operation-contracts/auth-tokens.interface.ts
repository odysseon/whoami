/**
 * The standard payload returned upon successful authentication or token refresh.
 */
export interface IAuthTokens {
  accessToken: string;
  refreshToken?: string;
}
