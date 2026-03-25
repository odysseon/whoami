export interface IWhoamiAuthMethodsStatus {
  credentials: boolean;
  oauth: boolean;
}

export interface IWhoamiAuthStatus {
  authMethods: IWhoamiAuthMethodsStatus;
  refreshTokens: boolean;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number | null;
}
