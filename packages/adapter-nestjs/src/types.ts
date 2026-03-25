import type {
  IDeterministicTokenHasher,
  IEmailUserRepository,
  IRefreshTokenRepository,
  IPasswordHasher,
  ITokenSigner,
  ILogger,
} from "@odysseon/whoami-core";

export interface WhoamiNestModuleOptions {
  userRepository: new (...args: unknown[]) => IEmailUserRepository;
  refreshTokenRepository: new (...args: unknown[]) => IRefreshTokenRepository;

  // Optional; defaults to the official adapters.
  passwordHasher?: new (...args: unknown[]) => IPasswordHasher;
  tokenHasher?: new (...args: unknown[]) => IDeterministicTokenHasher;
  tokenSigner?: new (...args: unknown[]) => ITokenSigner;
  logger?: new (...args: unknown[]) => ILogger;

  // Convenience config for default JoseTokenSigner when tokenSigner is unspecified.
  tokenSignerOptions?: {
    secret: string;
    issuer?: string;
    audience?: string;
  };
}
