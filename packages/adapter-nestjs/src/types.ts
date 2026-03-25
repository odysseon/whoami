import type {
  IDeterministicTokenHasher,
  IEmailUserRepository,
  IRefreshTokenRepository,
  IPasswordHasher,
  ITokenSigner,
  ITokenExtractor,
  ILogger,
} from "@odysseon/whoami-core";

// Type for NestJS injection tokens
type InjectionToken = string | symbol | ((...args: unknown[]) => unknown);
type ClassType<T> = new (...args: unknown[]) => T;

export interface WhoamiNestControllerOptions {
  enabled?: boolean;
  path?: string;
}

interface AsyncProviderOptions<T> {
  useClass?: ClassType<T>;
  useFactory?: (...args: unknown[]) => T | Promise<T>;
  useExisting?: string | symbol;
  inject?: InjectionToken[];
}

export interface WhoamiNestModuleOptions {
  userRepository: ClassType<IEmailUserRepository>;
  refreshTokenRepository: ClassType<IRefreshTokenRepository>;

  // Optional; defaults to the official adapters.
  passwordHasher?: ClassType<IPasswordHasher>;
  tokenHasher?: ClassType<IDeterministicTokenHasher>;
  tokenSigner?: ClassType<ITokenSigner>;
  tokenExtractor?: ClassType<ITokenExtractor>;
  logger?: ClassType<ILogger>;
  controller?: WhoamiNestControllerOptions | false;

  // Convenience config for default JoseTokenSigner when tokenSigner is unspecified.
  tokenSignerOptions?: {
    secret: string;
    issuer?: string;
    audience?: string;
  };
}

// Type for NestJS module imports (accepts modules, classes, dynamic modules, etc.)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ModuleImports = any[];

export interface WhoamiNestModuleAsyncOptions {
  imports?: ModuleImports;

  userRepository: AsyncProviderOptions<IEmailUserRepository>;
  refreshTokenRepository: AsyncProviderOptions<IRefreshTokenRepository>;

  // Optional; defaults to the official adapters.
  passwordHasher?: AsyncProviderOptions<IPasswordHasher>;
  tokenHasher?: AsyncProviderOptions<IDeterministicTokenHasher>;
  tokenSigner?: AsyncProviderOptions<ITokenSigner>;
  tokenExtractor?: AsyncProviderOptions<ITokenExtractor>;
  logger?: AsyncProviderOptions<ILogger>;
  controller?: WhoamiNestControllerOptions | false;

  // Convenience config for default JoseTokenSigner when tokenSigner is unspecified.
  tokenSignerOptions?: {
    useFactory: (...args: unknown[]) =>
      | {
          secret: string;
          issuer?: string;
          audience?: string;
        }
      | Promise<{
          secret: string;
          issuer?: string;
          audience?: string;
        }>;
    inject?: InjectionToken[];
  };
}
