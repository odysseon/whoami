export interface IWhoamiAuthMethodsStatus {
  credentials: boolean;
  googleOAuth: boolean;
}

export interface IWhoamiAuthStatus {
  authMethods: IWhoamiAuthMethodsStatus;
  refreshTokens: boolean;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number | null;
}
