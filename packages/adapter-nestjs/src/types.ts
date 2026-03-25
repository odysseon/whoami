import type {
  IDeterministicTokenHasher,
  IEmailUserRepository,
  IGoogleIdTokenVerifier,
  IGoogleUserRepository,
  IRefreshTokenRepository,
  IPasswordHasher,
  ITokenExtractor,
  ITokenSigner,
  IWhoamiAuthConfiguration,
  ILogger,
} from "@odysseon/whoami-core";

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
  useValue?: T;
  inject?: InjectionToken[];
}

export interface WhoamiNestModuleOptions {
  userRepository?: ClassType<IEmailUserRepository>;
  googleUserRepository?: ClassType<IGoogleUserRepository>;
  refreshTokenRepository?: ClassType<IRefreshTokenRepository>;
  passwordHasher?: ClassType<IPasswordHasher>;
  tokenHasher?: ClassType<IDeterministicTokenHasher>;
  tokenSigner?: ClassType<ITokenSigner>;
  googleIdTokenVerifier?: ClassType<IGoogleIdTokenVerifier>;
  tokenExtractor?: ClassType<ITokenExtractor>;
  logger?: ClassType<ILogger>;
  configuration?: IWhoamiAuthConfiguration;
  controller?: WhoamiNestControllerOptions | false;
  tokenSignerOptions?: {
    secret: string;
    issuer?: string;
    audience?: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ModuleImports = any[];

export interface WhoamiNestModuleAsyncOptions {
  imports?: ModuleImports;
  userRepository?: AsyncProviderOptions<IEmailUserRepository>;
  googleUserRepository?: AsyncProviderOptions<IGoogleUserRepository>;
  refreshTokenRepository?: AsyncProviderOptions<IRefreshTokenRepository>;
  passwordHasher?: AsyncProviderOptions<IPasswordHasher>;
  tokenHasher?: AsyncProviderOptions<IDeterministicTokenHasher>;
  tokenSigner?: AsyncProviderOptions<ITokenSigner>;
  googleIdTokenVerifier?: AsyncProviderOptions<IGoogleIdTokenVerifier>;
  tokenExtractor?: AsyncProviderOptions<ITokenExtractor>;
  logger?: AsyncProviderOptions<ILogger>;
  configuration?: AsyncProviderOptions<IWhoamiAuthConfiguration>;
  controller?: WhoamiNestControllerOptions | false;
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
