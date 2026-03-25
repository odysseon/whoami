import type { IJwtPayload } from "../interfaces/models/jwt-payload.interface.js";
import type {
  IUser,
  IUserWithEmail,
} from "../interfaces/models/user.interface.js";
import { WhoamiError } from "../errors/whoami-error.js";
import type { IAuthTokens } from "../interfaces/operation-contracts/auth-tokens.interface.js";
import type { IWhoamiAuthConfiguration } from "../interfaces/operation-contracts/auth-configuration.interface.js";
import type { IWhoamiAuthStatus } from "../interfaces/operation-contracts/auth-status.interface.js";
import type { IGoogleOAuthCredentials } from "../interfaces/operation-contracts/google-oauth-credentials.interface.js";
import type { IEmailPasswordCredentials } from "../interfaces/operation-contracts/login-credentials.interface.js";
import type { IRegisterWithEmailData } from "../interfaces/operation-contracts/register-data.interface.js";
import type { IRefreshTokenRepository } from "../interfaces/ports/repositories/refresh-token-repository.port.js";
import type {
  IEmailUserRepository,
  IGoogleUserRepository,
} from "../interfaces/ports/repositories/user-repository.port.js";
import type { IDeterministicTokenHasher } from "../interfaces/ports/security/deterministic-token-hasher.port.js";
import type { IGoogleIdTokenVerifier } from "../interfaces/ports/security/google-id-token-verifier.port.js";
import type { IPasswordHasher } from "../interfaces/ports/security/password-hasher.port.js";
import type { ITokenSigner } from "../interfaces/ports/security/token-signer.port.js";
import type { ILogger } from "../interfaces/ports/utilities/logger.port.js";

const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 900;
const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * The strict dependencies required to instantiate the WhoamiService.
 */
export interface WhoamiServiceDependencies {
  tokenSigner: ITokenSigner;
  logger: ILogger;
  userRepository?: IEmailUserRepository;
  googleUserRepository?: IGoogleUserRepository;
  refreshTokenRepository?: IRefreshTokenRepository;
  passwordHasher?: IPasswordHasher;
  tokenHasher?: IDeterministicTokenHasher;
  googleIdTokenVerifier?: IGoogleIdTokenVerifier;
  configuration?: IWhoamiAuthConfiguration;
}

export class WhoamiService {
  private readonly status: IWhoamiAuthStatus;

  constructor(private readonly deps: WhoamiServiceDependencies) {
    this.status = this.resolveStatus();
    this.validateConfiguration();
    this.logStatus();
  }

  public getAuthStatus(): IWhoamiAuthStatus {
    return {
      authMethods: { ...this.status.authMethods },
      refreshTokens: this.status.refreshTokens,
      accessTokenTtlSeconds: this.status.accessTokenTtlSeconds,
      refreshTokenTtlSeconds: this.status.refreshTokenTtlSeconds,
    };
  }

  public async registerWithEmail(
    data: IRegisterWithEmailData,
  ): Promise<IUserWithEmail> {
    this.ensureCredentialsEnabled("Registration failed");

    if (!data.password || data.password.trim() === "") {
      this.deps.logger.warn("Registration failed: Empty password provided");
      throw new WhoamiError("INVALID_CREDENTIALS", "Password cannot be empty.");
    }

    const userRepository = this.getEmailUserRepository();
    const passwordHasher = this.getPasswordHasher();

    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      this.deps.logger.warn("Registration attempt with existing email", {
        email: data.email,
      });
      throw new WhoamiError(
        "USER_ALREADY_EXISTS",
        "An identity with this email already exists.",
      );
    }

    const passwordHash = await passwordHasher.hash(data.password);
    const newUser = await userRepository.create({
      email: data.email,
      passwordHash,
    });

    this.deps.logger.info("New identity registered via email", {
      userId: newUser.id,
    });

    return newUser;
  }

  public async loginWithEmail(
    credentials: IEmailPasswordCredentials,
  ): Promise<IAuthTokens> {
    this.ensureCredentialsEnabled("Email login failed");

    const genericError = new WhoamiError(
      "INVALID_CREDENTIALS",
      "Invalid email or password.",
    );
    if (!credentials.password || credentials.password.trim() === "") {
      this.deps.logger.warn("Login failed: Empty password provided");
      throw genericError;
    }

    const userRepository = this.getEmailUserRepository();
    const passwordHasher = this.getPasswordHasher();
    const user = await userRepository.findByEmail(credentials.email);

    if (!user) {
      this.deps.logger.warn("Failed login attempt: User not found", {
        email: credentials.email,
      });
      throw genericError;
    }

    const isValidPassword = await passwordHasher.verify(
      user.passwordHash,
      credentials.password,
    );
    if (!isValidPassword) {
      this.deps.logger.warn("Failed login attempt: Invalid password", {
        userId: user.id,
      });
      throw genericError;
    }

    const tokens = await this.issueTokens(user.id);
    this.deps.logger.info("Successful login via credentials", {
      userId: user.id,
      refreshTokensEnabled: this.status.refreshTokens,
    });

    return tokens;
  }

  public async loginWithGoogle(
    credentials: IGoogleOAuthCredentials,
  ): Promise<IAuthTokens> {
    this.ensureGoogleEnabled("Google login failed");

    if (!credentials.idToken || credentials.idToken.trim() === "") {
      this.deps.logger.warn("Google login failed: Empty ID token provided");
      throw new WhoamiError(
        "INVALID_CREDENTIALS",
        "Google ID token is required.",
      );
    }

    const googleVerifier = this.getGoogleIdTokenVerifier();
    const googleUserRepository = this.getGoogleUserRepository();
    const googleIdentity = await googleVerifier.verify(credentials.idToken);
    const user = await googleUserRepository.resolveGoogleUser(googleIdentity);
    const tokens = await this.issueTokens(user.id);

    this.deps.logger.info("Successful login via Google OAuth", {
      userId: user.id,
      googleSub: googleIdentity.sub,
      refreshTokensEnabled: this.status.refreshTokens,
    });

    return tokens;
  }

  public async refreshTokens(
    rawRefreshTokenString: string,
  ): Promise<IAuthTokens> {
    this.ensureRefreshTokensEnabled();

    if (!rawRefreshTokenString || rawRefreshTokenString.trim() === "") {
      this.deps.logger.warn("Token refresh failed: Empty token provided");
      throw new WhoamiError(
        "INVALID_CREDENTIALS",
        "Invalid or expired refresh token.",
      );
    }

    const tokenHasher = this.getTokenHasher();
    const refreshTokenRepository = this.getRefreshTokenRepository();
    const oldTokenHash = await tokenHasher.hash(rawRefreshTokenString);
    const tokenRecord = await refreshTokenRepository.findByHash(oldTokenHash);

    if (!tokenRecord) {
      this.deps.logger.warn("Token refresh failed: Token not found");
      throw new WhoamiError(
        "INVALID_CREDENTIALS",
        "Invalid or expired refresh token.",
      );
    }

    if (tokenRecord.isRevoked) {
      this.deps.logger.error(
        "SECURITY ALERT: Attempted use of revoked refresh token",
        undefined,
        {
          userId: tokenRecord.userId,
        },
      );
      await refreshTokenRepository.revokeAllForUser(tokenRecord.userId);
      throw new WhoamiError("TOKEN_REUSED", "Token has been revoked.");
    }

    if (tokenRecord.expiresAt < new Date()) {
      this.deps.logger.warn("Token refresh failed: Token expired", {
        userId: tokenRecord.userId,
      });
      throw new WhoamiError("TOKEN_EXPIRED", "Refresh token has expired.");
    }

    const user = await this.findUserById(tokenRecord.userId);
    if (!user) {
      this.deps.logger.warn("Token refresh failed: User no longer exists", {
        userId: tokenRecord.userId,
      });
      throw new WhoamiError("USER_NOT_FOUND", "User no longer exists.");
    }

    const accessToken = await this.deps.tokenSigner.sign(
      { sub: user.id },
      this.status.accessTokenTtlSeconds,
    );
    const newRawRefreshToken = crypto.randomUUID();
    const newHashedRefreshToken = await tokenHasher.hash(newRawRefreshToken);
    const expirationDate = new Date(
      Date.now() + this.getRefreshTokenTtlSeconds() * 1000,
    );

    const rotated = await refreshTokenRepository.rotate(oldTokenHash, {
      userId: user.id,
      tokenHash: newHashedRefreshToken,
      expiresAt: expirationDate,
      isRevoked: false,
    });

    if (!rotated) {
      this.deps.logger.error(
        "SECURITY ALERT: Token reuse detected during atomic rotation",
        undefined,
        { userId: user.id },
      );
      await refreshTokenRepository.revokeAllForUser(user.id);
      throw new WhoamiError("TOKEN_REUSED", "Token reuse detected.");
    }

    this.deps.logger.info("Tokens rotated successfully", { userId: user.id });

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  public async verifyAccessToken(accessToken: string): Promise<IJwtPayload> {
    return await this.deps.tokenSigner.verify(accessToken);
  }

  private resolveStatus(): IWhoamiAuthStatus {
    const configuration = this.deps.configuration;
    const accessTokenTtlSeconds =
      configuration?.accessTokenTtlSeconds ?? DEFAULT_ACCESS_TOKEN_TTL_SECONDS;
    const refreshTokensEnabled =
      configuration?.refreshTokens?.enabled ??
      Boolean(this.deps.refreshTokenRepository && this.deps.tokenHasher);

    return {
      authMethods: {
        credentials:
          configuration?.authMethods?.credentials ??
          Boolean(this.deps.userRepository && this.deps.passwordHasher),
        googleOAuth:
          configuration?.authMethods?.googleOAuth ??
          Boolean(
            this.deps.googleUserRepository && this.deps.googleIdTokenVerifier,
          ),
      },
      refreshTokens: refreshTokensEnabled,
      accessTokenTtlSeconds,
      refreshTokenTtlSeconds: refreshTokensEnabled
        ? (configuration?.refreshTokenTtlSeconds ??
          DEFAULT_REFRESH_TOKEN_TTL_SECONDS)
        : null,
    };
  }

  private validateConfiguration(): void {
    if (this.status.accessTokenTtlSeconds <= 0) {
      throw new Error("WhoamiService requires accessTokenTtlSeconds > 0.");
    }

    if (
      this.status.refreshTokens &&
      (!this.status.refreshTokenTtlSeconds ||
        this.status.refreshTokenTtlSeconds <= 0)
    ) {
      throw new Error(
        "WhoamiService requires refreshTokenTtlSeconds > 0 when refresh tokens are enabled.",
      );
    }

    if (this.status.authMethods.credentials) {
      this.getEmailUserRepository();
      this.getPasswordHasher();
    }

    if (this.status.authMethods.googleOAuth) {
      this.getGoogleUserRepository();
      this.getGoogleIdTokenVerifier();
    }

    if (this.status.refreshTokens) {
      this.getRefreshTokenRepository();
      this.getTokenHasher();
    }
  }

  private logStatus(): void {
    this.deps.logger.info("Credentials authentication status", {
      enabled: this.status.authMethods.credentials,
    });
    this.deps.logger.info("Google OAuth authentication status", {
      enabled: this.status.authMethods.googleOAuth,
    });
    this.deps.logger.info("Refresh token status", {
      enabled: this.status.refreshTokens,
    });
  }

  private ensureCredentialsEnabled(message: string): void {
    if (!this.status.authMethods.credentials) {
      this.deps.logger.warn(`${message}: Credentials authentication disabled`);
      throw new WhoamiError(
        "AUTH_METHOD_DISABLED",
        "Credentials authentication is disabled.",
      );
    }
  }

  private ensureGoogleEnabled(message: string): void {
    if (!this.status.authMethods.googleOAuth) {
      this.deps.logger.warn(`${message}: Google OAuth authentication disabled`);
      throw new WhoamiError(
        "AUTH_METHOD_DISABLED",
        "Google OAuth authentication is disabled.",
      );
    }
  }

  private ensureRefreshTokensEnabled(): void {
    if (!this.status.refreshTokens) {
      this.deps.logger.warn("Token refresh failed: Refresh tokens disabled");
      throw new WhoamiError(
        "AUTH_METHOD_DISABLED",
        "Refresh tokens are disabled.",
      );
    }
  }

  private getEmailUserRepository(): IEmailUserRepository {
    if (!this.deps.userRepository) {
      throw new Error(
        "WhoamiService requires userRepository when credentials authentication is enabled.",
      );
    }

    return this.deps.userRepository;
  }

  private getGoogleUserRepository(): IGoogleUserRepository {
    if (!this.deps.googleUserRepository) {
      throw new Error(
        "WhoamiService requires googleUserRepository when Google OAuth is enabled.",
      );
    }

    return this.deps.googleUserRepository;
  }

  private getRefreshTokenRepository(): IRefreshTokenRepository {
    if (!this.deps.refreshTokenRepository) {
      throw new Error(
        "WhoamiService requires refreshTokenRepository when refresh tokens are enabled.",
      );
    }

    return this.deps.refreshTokenRepository;
  }

  private getPasswordHasher(): IPasswordHasher {
    if (!this.deps.passwordHasher) {
      throw new Error(
        "WhoamiService requires passwordHasher when credentials authentication is enabled.",
      );
    }

    return this.deps.passwordHasher;
  }

  private getTokenHasher(): IDeterministicTokenHasher {
    if (!this.deps.tokenHasher) {
      throw new Error(
        "WhoamiService requires tokenHasher when refresh tokens are enabled.",
      );
    }

    return this.deps.tokenHasher;
  }

  private getGoogleIdTokenVerifier(): IGoogleIdTokenVerifier {
    if (!this.deps.googleIdTokenVerifier) {
      throw new Error(
        "WhoamiService requires googleIdTokenVerifier when Google OAuth is enabled.",
      );
    }

    return this.deps.googleIdTokenVerifier;
  }

  private getRefreshTokenTtlSeconds(): number {
    if (this.status.refreshTokenTtlSeconds === null) {
      throw new Error(
        "WhoamiService refresh token TTL is unavailable when refresh tokens are disabled.",
      );
    }

    return this.status.refreshTokenTtlSeconds;
  }

  private async issueTokens(userId: string): Promise<IAuthTokens> {
    const accessToken = await this.deps.tokenSigner.sign(
      { sub: userId },
      this.status.accessTokenTtlSeconds,
    );

    if (!this.status.refreshTokens) {
      return { accessToken };
    }

    const rawRefreshToken = crypto.randomUUID();
    const tokenHasher = this.getTokenHasher();
    const refreshTokenRepository = this.getRefreshTokenRepository();
    const hashedRefreshToken = await tokenHasher.hash(rawRefreshToken);
    const expirationDate = new Date(
      Date.now() + this.getRefreshTokenTtlSeconds() * 1000,
    );

    await refreshTokenRepository.store({
      userId,
      tokenHash: hashedRefreshToken,
      expiresAt: expirationDate,
      isRevoked: false,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  private async findUserById(userId: string): Promise<IUser | null> {
    if (this.deps.userRepository) {
      const user = await this.deps.userRepository.findById(userId);
      if (user) {
        return user;
      }
    }

    if (this.deps.googleUserRepository) {
      return await this.deps.googleUserRepository.findById(userId);
    }

    return null;
  }
}
