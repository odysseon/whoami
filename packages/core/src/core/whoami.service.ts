import type { IEmailUserRepository } from "../interfaces/ports/repositories/user-repository.port.js";
import type { IRefreshTokenRepository } from "../interfaces/ports/repositories/refresh-token-repository.port.js";
import type { IPasswordHasher } from "../interfaces/ports/security/password-hasher.port.js";
import type { ITokenHasher } from "../interfaces/ports/security/token-hasher.port.js";
import type { ITokenSigner } from "../interfaces/ports/security/token-signer.port.js";
import type { ILogger } from "../interfaces/ports/utilities/logger.port.js";

import type { IUserWithEmail } from "../interfaces/models/user.interface.js";
import type { IJwtPayload } from "../interfaces/models/jwt-payload.interface.js";
import type { IAuthTokens } from "../interfaces/operation-contracts/auth-tokens.interface.js";
import type { IEmailPasswordCredentials } from "../interfaces/operation-contracts/login-credentials.interface.js";
import type { IRegisterWithEmailData } from "../interfaces/operation-contracts/register-data.interface.js";

import { WhoamiError } from "../errors/whoami-error.js";

/**
 * The strict dependencies required to instantiate the WhoamiService.
 */
export interface WhoamiServiceDependencies {
  userRepository: IEmailUserRepository;
  refreshTokenRepository: IRefreshTokenRepository;
  passwordHasher: IPasswordHasher;
  tokenHasher: ITokenHasher;
  tokenSigner: ITokenSigner;
  logger: ILogger;
}

export class WhoamiService {
  constructor(private readonly deps: WhoamiServiceDependencies) {}

  public async registerWithEmail(
    data: IRegisterWithEmailData,
  ): Promise<IUserWithEmail> {
    // 1. Check if the identity already exists
    const existingUser = await this.deps.userRepository.findByEmail(data.email);
    if (existingUser) {
      this.deps.logger.warn("Registration attempt with existing email", {
        email: data.email,
      });
      throw new WhoamiError(
        "USER_ALREADY_EXISTS",
        "An identity with this email already exists.",
      );
    }

    // 2. Hash the plaintext password
    const passwordHash = await this.deps.passwordHasher.hash(data.password);

    // 3. Persist the new identity
    const newUser = await this.deps.userRepository.create({
      email: data.email,
      passwordHash,
    });

    // 4. Log the success and return the segregated user model
    this.deps.logger.info("New identity registered via email", {
      userId: newUser.id,
    });

    return newUser;
  }

  public async loginWithEmail(
    credentials: IEmailPasswordCredentials,
  ): Promise<IAuthTokens> {
    const genericError = new WhoamiError(
      "INVALID_CREDENTIALS",
      "Invalid email or password.",
    );

    // 1. Fetch the identity
    const user = await this.deps.userRepository.findByEmail(credentials.email);
    if (!user) {
      this.deps.logger.warn("Failed login attempt: User not found", {
        email: credentials.email,
      });
      throw genericError;
    }

    // 2. Verify the cryptographic proof (password)
    const isValidPassword = await this.deps.passwordHasher.verify(
      user.passwordHash,
      credentials.password,
    );
    if (!isValidPassword) {
      this.deps.logger.warn("Failed login attempt: Invalid password", {
        userId: user.id,
      });
      throw genericError;
    }

    // 3. Generate the short-lived Access Token (e.g., 15 minutes = 900 seconds)
    const accessToken = await this.deps.tokenSigner.sign({ sub: user.id }, 900);

    // 4. Generate the long-lived Refresh Token (e.g., 7 days)
    const rawRefreshToken = crypto.randomUUID();
    const hashedRefreshToken =
      await this.deps.tokenHasher.hash(rawRefreshToken);

    const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 5. Persist the HASHED refresh token
    await this.deps.refreshTokenRepository.store({
      userId: user.id,
      tokenHash: hashedRefreshToken,
      expiresAt: expirationDate,
      isRevoked: false,
    });

    this.deps.logger.info("Successful login", { userId: user.id });

    // 6. Return the raw tokens to the client
    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  public async refreshTokens(
    rawRefreshTokenString: string,
  ): Promise<IAuthTokens> {
    // 1. Hash the incoming token to safely query the DB
    const tokenHash = await this.deps.tokenHasher.hash(rawRefreshTokenString);

    // 2. Atomically attempt to consume the token
    const tokenRecord =
      await this.deps.refreshTokenRepository.consume(tokenHash);
    if (!tokenRecord) {
      this.deps.logger.warn(
        "Token refresh failed: Token not found or already consumed",
      );
      throw new WhoamiError(
        "INVALID_CREDENTIALS",
        "Invalid or expired refresh token.",
      );
    }

    // 3. Check expiration
    if (tokenRecord.expiresAt < new Date()) {
      this.deps.logger.warn("Token refresh failed: Token expired", {
        userId: tokenRecord.userId,
      });
      throw new WhoamiError("TOKEN_EXPIRED", "Refresh token has expired.");
    }

    // 4. Check revocation (Defense in depth)
    // If a revoked token is used, assume a breach and nuke all sessions for this user.
    if (tokenRecord.isRevoked) {
      this.deps.logger.error(
        "SECURITY ALERT: Attempted use of revoked refresh token",
        undefined,
        {
          userId: tokenRecord.userId,
        },
      );
      await this.deps.refreshTokenRepository.revokeAllForUser(
        tokenRecord.userId,
      );
      throw new WhoamiError("INVALID_CREDENTIALS", "Token has been revoked.");
    }

    // 5. Ensure the user still exists (hasn't been deleted since the token was issued)
    const user = await this.deps.userRepository.findById(tokenRecord.userId);
    if (!user) {
      this.deps.logger.warn("Token refresh failed: User no longer exists", {
        userId: tokenRecord.userId,
      });
      throw new WhoamiError("USER_NOT_FOUND", "User no longer exists.");
    }

    // 6. Generate new tokens (Rotation)
    const newAccessToken = await this.deps.tokenSigner.sign(
      { sub: user.id },
      900,
    );
    const newRawRefreshToken = crypto.randomUUID();
    const newHashedRefreshToken =
      await this.deps.tokenHasher.hash(newRawRefreshToken);

    const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 7. Store the new token
    await this.deps.refreshTokenRepository.store({
      userId: user.id,
      tokenHash: newHashedRefreshToken,
      expiresAt: expirationDate,
      isRevoked: false,
    });

    this.deps.logger.info("Tokens rotated successfully", { userId: user.id });

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  public async verifyAccessToken(accessToken: string): Promise<IJwtPayload> {
    // The TokenSigner adapter is contractually obligated to throw a WhoamiError
    // if the token is expired or malformed. We just pass the execution through.
    return await this.deps.tokenSigner.verify(accessToken);
  }
}
