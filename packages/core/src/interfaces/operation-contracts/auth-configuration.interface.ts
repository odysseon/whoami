import { HasId } from "../models/user.interface.js";
import { IRefreshTokenRepository } from "../ports/repositories/refresh-token-repository.port.js";
import {
  IOAuthUserRepository,
  IPasswordUserRepository,
} from "../ports/repositories/user-repository.port.js";
import { IDeterministicTokenHasher } from "../ports/security/deterministic-token-hasher.port.js";
import { IPasswordHasher } from "../ports/security/password-hasher.port.js";
import { ITokenGenerator } from "../ports/security/token-generator.port.js";
import { ITokenSigner } from "../ports/security/token-signer.port.js";
import { ILogger } from "../ports/utilities/logger.port.js";

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

export interface WhoamiServiceDependencies<TEntity extends HasId = HasId> {
  tokenSigner: ITokenSigner;
  logger: ILogger;
  passwordUserRepository?: IPasswordUserRepository<TEntity>;
  oauthUserRepository?: IOAuthUserRepository<TEntity>;
  refreshTokenRepository?: IRefreshTokenRepository<TEntity["id"]>;
  passwordHasher?: IPasswordHasher;
  tokenHasher?: IDeterministicTokenHasher;
  tokenGenerator?: ITokenGenerator;
  configuration?: IWhoamiAuthConfiguration;
}
