import { DynamicModule, Module, Provider, Type } from "@nestjs/common";
import type {
  IDeterministicTokenHasher,
  IEmailUserRepository,
  IGoogleIdTokenVerifier,
  IGoogleUserRepository,
  IRefreshTokenRepository,
  IWhoamiAuthConfiguration,
  IPasswordHasher,
  ITokenSigner,
  ILogger,
  WhoamiServiceDependencies,
} from "@odysseon/whoami-core";
import { WhoamiError, WhoamiService } from "@odysseon/whoami-core";
import { JoseTokenSigner } from "@odysseon/whoami-adapter-jose";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { WebCryptoTokenHasher } from "@odysseon/whoami-adapter-webcrypto";
import { BearerTokenExtractor } from "./default-token-extractor.js";
import { NestLoggerAdapter } from "./nest-logger.adapter.js";
import {
  WHOAMI_CONFIGURATION,
  WHOAMI_GOOGLE_ID_TOKEN_VERIFIER,
  WHOAMI_GOOGLE_USER_REPOSITORY,
  WHOAMI_LOGGER,
  WHOAMI_PASSWORD_HASHER,
  WHOAMI_REFRESH_TOKEN_REPOSITORY,
  WHOAMI_TOKEN_EXTRACTOR,
  WHOAMI_TOKEN_HASHER,
  WHOAMI_TOKEN_SIGNER,
  WHOAMI_USER_REPOSITORY,
} from "./constants.js";
import type {
  WhoamiNestControllerOptions,
  WhoamiNestModuleAsyncOptions,
  WhoamiNestModuleOptions,
} from "./types.js";
import { createWhoamiController } from "./whoami.controller.js";
import { WhoamiAuthGuard } from "./whoami-auth.guard.js";

type AsyncProviderOptions<T> = {
  useClass?: new (...args: unknown[]) => T;
  useFactory?: (...args: unknown[]) => T | Promise<T>;
  useExisting?: string | symbol;
  useValue?: T;
  inject?: Array<string | symbol | ((...args: unknown[]) => unknown)>;
};

type OptionalInjectToken = {
  token: string;
  optional: true;
};

function optionalInject(token: string): OptionalInjectToken {
  return {
    token,
    optional: true,
  };
}

function cloneConfiguration(
  configuration: IWhoamiAuthConfiguration | undefined,
): IWhoamiAuthConfiguration | undefined {
  if (!configuration) {
    return undefined;
  }

  return {
    authMethods: configuration.authMethods
      ? { ...configuration.authMethods }
      : undefined,
    refreshTokens: configuration.refreshTokens
      ? { ...configuration.refreshTokens }
      : undefined,
    accessTokenTtlSeconds: configuration.accessTokenTtlSeconds,
    refreshTokenTtlSeconds: configuration.refreshTokenTtlSeconds,
  };
}

function resolveController(
  options?: WhoamiNestControllerOptions | false,
): Array<Type<unknown>> {
  if (options === false || options?.enabled === false) {
    return [];
  }

  return [createWhoamiController(options?.path ?? "auth")];
}

function credentialsEnabled(configuration?: IWhoamiAuthConfiguration): boolean {
  return configuration?.authMethods?.credentials === true;
}

function refreshTokensEnabled(
  configuration?: IWhoamiAuthConfiguration,
): boolean {
  return configuration?.refreshTokens?.enabled === true;
}

function createConfigurationProvider(
  configuration: IWhoamiAuthConfiguration | undefined,
): Provider[] {
  if (!configuration) {
    return [];
  }

  return [
    {
      provide: WHOAMI_CONFIGURATION,
      useValue: cloneConfiguration(configuration),
    },
  ];
}

function createConfigurationAsyncProvider(
  options?: AsyncProviderOptions<IWhoamiAuthConfiguration>,
): Provider[] {
  if (!options) {
    return [];
  }

  if (options.useValue !== undefined) {
    return [
      {
        provide: WHOAMI_CONFIGURATION,
        useValue: cloneConfiguration(options.useValue),
      },
    ];
  }

  if (options.useClass) {
    return [
      {
        provide: WHOAMI_CONFIGURATION,
        useFactory: async (
          configuration: IWhoamiAuthConfiguration,
        ): Promise<IWhoamiAuthConfiguration | undefined> =>
          cloneConfiguration(configuration),
        inject: [options.useClass],
      },
      options.useClass,
    ];
  }

  if (options.useFactory) {
    return [
      {
        provide: WHOAMI_CONFIGURATION,
        useFactory: async (
          ...args: unknown[]
        ): Promise<IWhoamiAuthConfiguration | undefined> =>
          cloneConfiguration(await options.useFactory!(...args)),
        inject: options.inject ?? [],
      },
    ];
  }

  if (options.useExisting) {
    return [
      {
        provide: WHOAMI_CONFIGURATION,
        useFactory: async (
          configuration: IWhoamiAuthConfiguration,
        ): Promise<IWhoamiAuthConfiguration | undefined> =>
          cloneConfiguration(configuration),
        inject: [options.useExisting],
      },
    ];
  }

  return [];
}

function createTokenSignerConfigurationError(): WhoamiError {
  return new WhoamiError(
    "INVALID_CONFIGURATION",
    "WhoamiModule requires either tokenSigner or tokenSignerOptions.",
  );
}

function createWhoamiServiceProvider(): Provider {
  return {
    provide: WhoamiService,
    useFactory: (
      userRepository: IEmailUserRepository | undefined,
      googleUserRepository: IGoogleUserRepository | undefined,
      refreshTokenRepository: IRefreshTokenRepository | undefined,
      passwordHasher: IPasswordHasher | undefined,
      tokenHasher: IDeterministicTokenHasher | undefined,
      tokenSigner: ITokenSigner,
      googleIdTokenVerifier: IGoogleIdTokenVerifier | undefined,
      logger: ILogger,
      configuration: IWhoamiAuthConfiguration | undefined,
    ): WhoamiService => {
      const deps: WhoamiServiceDependencies = {
        userRepository,
        googleUserRepository,
        refreshTokenRepository,
        passwordHasher,
        tokenHasher,
        tokenSigner,
        googleIdTokenVerifier,
        logger,
        configuration,
      };
      return new WhoamiService(deps);
    },
    inject: [
      optionalInject(WHOAMI_USER_REPOSITORY),
      optionalInject(WHOAMI_GOOGLE_USER_REPOSITORY),
      optionalInject(WHOAMI_REFRESH_TOKEN_REPOSITORY),
      optionalInject(WHOAMI_PASSWORD_HASHER),
      optionalInject(WHOAMI_TOKEN_HASHER),
      WHOAMI_TOKEN_SIGNER,
      optionalInject(WHOAMI_GOOGLE_ID_TOKEN_VERIFIER),
      WHOAMI_LOGGER,
      optionalInject(WHOAMI_CONFIGURATION),
    ],
  };
}

function pushIfDefined(
  providers: Provider[],
  provider: Provider | undefined,
): void {
  if (provider) {
    providers.push(provider);
  }
}

function syncProvider<T>(
  token: string,
  useClass?: new (...args: unknown[]) => T,
): Provider | undefined {
  if (!useClass) {
    return undefined;
  }

  return {
    provide: token,
    useClass,
  };
}

function asyncProvider<T>(
  token: string,
  options?: AsyncProviderOptions<T>,
): Provider | undefined {
  if (!options) {
    return undefined;
  }

  if (options.useValue !== undefined) {
    return {
      provide: token,
      useValue: options.useValue,
    };
  }

  if (options.useClass) {
    return {
      provide: token,
      useClass: options.useClass,
    };
  }

  if (options.useFactory) {
    return {
      provide: token,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };
  }

  if (options.useExisting) {
    return {
      provide: token,
      useExisting: options.useExisting,
    };
  }

  return undefined;
}

function createExports(
  hasConfiguration: boolean,
): Array<string | typeof WhoamiService | typeof WhoamiAuthGuard> {
  return hasConfiguration
    ? [
        WhoamiService,
        WhoamiAuthGuard,
        WHOAMI_TOKEN_EXTRACTOR,
        WHOAMI_CONFIGURATION,
      ]
    : [WhoamiService, WhoamiAuthGuard, WHOAMI_TOKEN_EXTRACTOR];
}

@Module({})
export class WhoamiModule {
  static register(options: WhoamiNestModuleOptions): DynamicModule {
    const providers: Provider[] = [];

    pushIfDefined(
      providers,
      syncProvider(WHOAMI_USER_REPOSITORY, options.userRepository),
    );
    pushIfDefined(
      providers,
      syncProvider(WHOAMI_GOOGLE_USER_REPOSITORY, options.googleUserRepository),
    );
    pushIfDefined(
      providers,
      syncProvider(
        WHOAMI_REFRESH_TOKEN_REPOSITORY,
        options.refreshTokenRepository,
      ),
    );
    pushIfDefined(
      providers,
      syncProvider(
        WHOAMI_PASSWORD_HASHER,
        credentialsEnabled(options.configuration)
          ? (options.passwordHasher ?? Argon2PasswordHasher)
          : undefined,
      ),
    );
    pushIfDefined(
      providers,
      syncProvider(
        WHOAMI_TOKEN_HASHER,
        refreshTokensEnabled(options.configuration)
          ? (options.tokenHasher ?? WebCryptoTokenHasher)
          : undefined,
      ),
    );
    pushIfDefined(
      providers,
      syncProvider(
        WHOAMI_GOOGLE_ID_TOKEN_VERIFIER,
        options.googleIdTokenVerifier,
      ),
    );
    providers.push(...createConfigurationProvider(options.configuration));
    providers.push({
      provide: WHOAMI_TOKEN_SIGNER,
      useFactory: (): ITokenSigner => {
        if (options.tokenSigner) {
          return new options.tokenSigner();
        }

        if (options.tokenSignerOptions) {
          return new JoseTokenSigner(options.tokenSignerOptions);
        }

        throw createTokenSignerConfigurationError();
      },
    });
    providers.push({
      provide: WHOAMI_TOKEN_EXTRACTOR,
      useClass: options.tokenExtractor ?? BearerTokenExtractor,
    });
    providers.push({
      provide: WHOAMI_LOGGER,
      useFactory: (): ILogger => {
        if (options.logger) {
          return new options.logger();
        }
        return new NestLoggerAdapter("WhoamiModule");
      },
    });
    providers.push(WhoamiAuthGuard);
    providers.push(createWhoamiServiceProvider());

    return {
      module: WhoamiModule,
      controllers: resolveController(options.controller),
      providers,
      exports: createExports(Boolean(options.configuration)),
    };
  }

  static registerAsync(options: WhoamiNestModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [];

    pushIfDefined(
      providers,
      asyncProvider(WHOAMI_USER_REPOSITORY, options.userRepository),
    );
    pushIfDefined(
      providers,
      asyncProvider(
        WHOAMI_GOOGLE_USER_REPOSITORY,
        options.googleUserRepository,
      ),
    );
    pushIfDefined(
      providers,
      asyncProvider(
        WHOAMI_REFRESH_TOKEN_REPOSITORY,
        options.refreshTokenRepository,
      ),
    );
    pushIfDefined(
      providers,
      asyncProvider(
        WHOAMI_GOOGLE_ID_TOKEN_VERIFIER,
        options.googleIdTokenVerifier,
      ),
    );
    providers.push(...createConfigurationAsyncProvider(options.configuration));

    if (options.passwordHasher) {
      pushIfDefined(
        providers,
        asyncProvider(WHOAMI_PASSWORD_HASHER, options.passwordHasher),
      );
    } else if (
      options.configuration?.useValue?.authMethods?.credentials === true
    ) {
      providers.push({
        provide: WHOAMI_PASSWORD_HASHER,
        useClass: Argon2PasswordHasher,
      });
    }

    if (options.tokenHasher) {
      pushIfDefined(
        providers,
        asyncProvider(WHOAMI_TOKEN_HASHER, options.tokenHasher),
      );
    } else if (
      options.configuration?.useValue?.refreshTokens?.enabled === true
    ) {
      providers.push({
        provide: WHOAMI_TOKEN_HASHER,
        useClass: WebCryptoTokenHasher,
      });
    }

    if (options.tokenSigner?.useValue !== undefined) {
      providers.push({
        provide: WHOAMI_TOKEN_SIGNER,
        useValue: options.tokenSigner.useValue,
      });
    } else if (options.tokenSigner?.useClass) {
      providers.push({
        provide: WHOAMI_TOKEN_SIGNER,
        useClass: options.tokenSigner.useClass,
      });
    } else if (options.tokenSigner?.useFactory) {
      providers.push({
        provide: WHOAMI_TOKEN_SIGNER,
        useFactory: options.tokenSigner.useFactory,
        inject: options.tokenSigner.inject ?? [],
      });
    } else if (options.tokenSigner?.useExisting) {
      providers.push({
        provide: WHOAMI_TOKEN_SIGNER,
        useExisting: options.tokenSigner.useExisting,
      });
    } else if (options.tokenSignerOptions) {
      const tokenSignerOptions = options.tokenSignerOptions;
      providers.push({
        provide: WHOAMI_TOKEN_SIGNER,
        useFactory: async (...args: unknown[]): Promise<ITokenSigner> => {
          const config = await tokenSignerOptions.useFactory(...args);
          return new JoseTokenSigner(config);
        },
        inject: tokenSignerOptions.inject ?? [],
      });
    } else {
      providers.push({
        provide: WHOAMI_TOKEN_SIGNER,
        useFactory: (): never => {
          throw createTokenSignerConfigurationError();
        },
      });
    }

    pushIfDefined(
      providers,
      asyncProvider(WHOAMI_TOKEN_EXTRACTOR, options.tokenExtractor),
    );
    if (!options.tokenExtractor) {
      providers.push({
        provide: WHOAMI_TOKEN_EXTRACTOR,
        useClass: BearerTokenExtractor,
      });
    }

    if (options.logger?.useValue !== undefined) {
      providers.push({
        provide: WHOAMI_LOGGER,
        useValue: options.logger.useValue,
      });
    } else if (options.logger?.useClass) {
      providers.push({
        provide: WHOAMI_LOGGER,
        useClass: options.logger.useClass,
      });
    } else if (options.logger?.useFactory) {
      providers.push({
        provide: WHOAMI_LOGGER,
        useFactory: options.logger.useFactory,
        inject: options.logger.inject ?? [],
      });
    } else if (options.logger?.useExisting) {
      providers.push({
        provide: WHOAMI_LOGGER,
        useExisting: options.logger.useExisting,
      });
    } else {
      providers.push({
        provide: WHOAMI_LOGGER,
        useFactory: (): ILogger => new NestLoggerAdapter("WhoamiModule"),
      });
    }

    providers.push(WhoamiAuthGuard);
    providers.push(createWhoamiServiceProvider());

    return {
      module: WhoamiModule,
      imports: options.imports,
      controllers: resolveController(options.controller),
      providers,
      exports: createExports(Boolean(options.configuration)),
    };
  }
}
