import type { IJwtPayload } from "../interfaces/models/jwt-payload.interface.js";
import type {
  IUser,
  IUserWithEmail,
} from "../interfaces/models/user.interface.js";
import type { IAuthTokens } from "../interfaces/operation-contracts/auth-tokens.interface.js";
import type { IWhoamiAuthConfiguration } from "../interfaces/operation-contracts/auth-configuration.interface.js";
import type { IWhoamiAuthStatus } from "../interfaces/operation-contracts/auth-status.interface.js";
import type {
  IEmailPasswordCredentials,
  IOAuthCredentials,
} from "../interfaces/operation-contracts/credentials.interface.js";
import type { IRefreshTokenRepository } from "../interfaces/ports/repositories/refresh-token-repository.port.js";
import type {
  IPasswordUserRepository,
  IOAuthUserRepository,
} from "../interfaces/ports/repositories/user-repository.port.js";
import type { IDeterministicTokenHasher } from "../interfaces/ports/security/deterministic-token-hasher.port.js";
import type { IPasswordHasher } from "../interfaces/ports/security/password-hasher.port.js";
import type { ITokenSigner } from "../interfaces/ports/security/token-signer.port.js";
import type { ILogger } from "../interfaces/ports/utilities/logger.port.js";

// Import the sub-services
import { ConfigurationValidator } from "./services/configuration-validator.service.js";
import { TokenOrchestrator } from "./services/token-orchestrator.service.js";
import { CredentialAuthenticator } from "./services/credential-authenticator.service.js";
import { OAuthAuthenticator } from "./services/oauth-authenticator.service.js";

export interface WhoamiServiceDependencies {
  tokenSigner: ITokenSigner;
  logger: ILogger;
  passwordUserRepository?: IPasswordUserRepository;
  oauthUserRepository?: IOAuthUserRepository;
  refreshTokenRepository?: IRefreshTokenRepository;
  passwordHasher?: IPasswordHasher;
  tokenHasher?: IDeterministicTokenHasher;
  configuration?: IWhoamiAuthConfiguration;
}

export class WhoamiService {
  private readonly configValidator: ConfigurationValidator;
  private readonly tokenOrchestrator: TokenOrchestrator;
  private readonly credentialAuth: CredentialAuthenticator;
  private readonly oauthAuth: OAuthAuthenticator;

  constructor(private readonly deps: WhoamiServiceDependencies) {
    this.configValidator = new ConfigurationValidator(deps);
    const status = this.configValidator.status;

    this.tokenOrchestrator = new TokenOrchestrator(deps, status);
    this.credentialAuth = new CredentialAuthenticator(
      deps,
      status,
      this.tokenOrchestrator,
    );
    this.oauthAuth = new OAuthAuthenticator(
      deps,
      status,
      this.tokenOrchestrator,
    );
  }

  public getAuthStatus(): IWhoamiAuthStatus {
    return this.configValidator.status;
  }

  // --- CREDENTIAL METHODS ---
  public async registerWithEmail(
    data: IEmailPasswordCredentials,
  ): Promise<IUserWithEmail> {
    return await this.credentialAuth.register(data);
  }

  public async loginWithEmail(
    credentials: IEmailPasswordCredentials,
  ): Promise<IAuthTokens> {
    return await this.credentialAuth.login(credentials);
  }

  public async updatePassword(
    userId: string,
    newPassword: string,
  ): Promise<void> {
    return await this.credentialAuth.updatePassword(userId, newPassword);
  }

  // --- OAUTH METHODS ---
  public async loginWithOAuth(data: IOAuthCredentials): Promise<IAuthTokens> {
    return await this.oauthAuth.login(data);
  }

  public async linkOAuthProvider(
    userId: string,
    data: IOAuthCredentials,
  ): Promise<void> {
    return await this.oauthAuth.linkProvider(userId, data);
  }

  // --- TOKEN METHODS ---
  public async refreshTokens(
    rawRefreshTokenString: string,
  ): Promise<IAuthTokens> {
    return await this.tokenOrchestrator.refreshTokens(
      rawRefreshTokenString,
      (id) => this.findUserById(id),
    );
  }

  public async verifyAccessToken(accessToken: string): Promise<IJwtPayload> {
    return await this.tokenOrchestrator.verifyAccessToken(accessToken);
  }

  // --- INTERNAL ROUTING ---
  private async findUserById(userId: string): Promise<IUser | null> {
    if (this.deps.passwordUserRepository) {
      const user = await this.deps.passwordUserRepository.findById(userId);
      if (user) return user;
    }
    if (this.deps.oauthUserRepository) {
      return await this.deps.oauthUserRepository.findById(userId);
    }
    return null;
  }
}
