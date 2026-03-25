export interface IWhoamiAuthMethodsConfiguration {
  credentials?: boolean;
  googleOAuth?: boolean;
}

export interface IWhoamiRefreshTokensConfiguration {
  enabled?: boolean;
}

export interface IWhoamiAuthConfiguration {
  authMethods?: IWhoamiAuthMethodsConfiguration;
  refreshTokens?: IWhoamiRefreshTokensConfiguration;
  accessTokenTtlSeconds?: number;
  refreshTokenTtlSeconds?: number;
}
