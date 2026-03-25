export interface IWhoamiAuthMethodsConfiguration {
  credentials?: boolean;
  oauth?: boolean;
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
