import type {
  IDeterministicTokenHasher,
  IEmailUserRepository,
  IRefreshTokenRepository,
  IPasswordHasher,
  ITokenSigner,
  ILogger,
} from "@odysseon/whoami-core";

// Type for NestJS injection tokens
type InjectionToken = string | symbol | ((...args: unknown[]) => unknown);

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

export interface WhoamiNestModuleAsyncOptions {
  userRepository: {
    useClass?: new (...args: unknown[]) => IEmailUserRepository;
    useFactory?: (...args: unknown[]) => IEmailUserRepository;
    useExisting?: string | symbol;
    inject?: InjectionToken[];
  };
  refreshTokenRepository: {
    useClass?: new (...args: unknown[]) => IRefreshTokenRepository;
    useFactory?: (...args: unknown[]) => IRefreshTokenRepository;
    useExisting?: string | symbol;
    inject?: InjectionToken[];
  };

  // Optional; defaults to the official adapters.
  passwordHasher?: {
    useClass?: new (...args: unknown[]) => IPasswordHasher;
    useFactory?: (...args: unknown[]) => IPasswordHasher;
    useExisting?: string | symbol;
    inject?: InjectionToken[];
  };
  tokenHasher?: {
    useClass?: new (...args: unknown[]) => IDeterministicTokenHasher;
    useFactory?: (...args: unknown[]) => IDeterministicTokenHasher;
    useExisting?: string | symbol;
    inject?: InjectionToken[];
  };
  tokenSigner?: {
    useClass?: new (...args: unknown[]) => ITokenSigner;
    useFactory?: (...args: unknown[]) => ITokenSigner;
    useExisting?: string | symbol;
    inject?: InjectionToken[];
  };
  logger?: {
    useClass?: new (...args: unknown[]) => ILogger;
    useFactory?: (...args: unknown[]) => ILogger;
    useExisting?: string | symbol;
    inject?: InjectionToken[];
  };

  // Convenience config for default JoseTokenSigner when tokenSigner is unspecified.
  tokenSignerOptions?: {
    useFactory: (...args: unknown[]) => {
      secret: string;
      issuer?: string;
      audience?: string;
    };
    inject?: InjectionToken[];
  };
}
