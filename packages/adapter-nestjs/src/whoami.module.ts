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
import { WhoamiService } from "@odysseon/whoami-core";
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

function resolveController(
  options?: WhoamiNestControllerOptions | false,
): Array<Type<unknown>> {
  if (options === false || options?.enabled === false) {
    return [];
  }

  return [createWhoamiController(options?.path ?? "auth")];
}

function provideOptionalClass<T>(
  token: string,
  useClass?: new (...args: unknown[]) => T,
): Provider {
  if (useClass) {
    return {
      provide: token,
      useClass,
    };
  }

  return {
    provide: token,
    useValue: undefined,
  };
}

function provideAsyncOptional<T>(
  token: string,
  options?: AsyncProviderOptions<T>,
): Provider {
  if (options?.useValue !== undefined) {
    return {
      provide: token,
      useValue: options.useValue,
    };
  }

  if (options?.useClass) {
    return {
      provide: token,
      useClass: options.useClass,
    };
  }

  if (options?.useFactory) {
    return {
      provide: token,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };
  }

  if (options?.useExisting) {
    return {
      provide: token,
      useExisting: options.useExisting,
    };
  }

  return {
    provide: token,
    useValue: undefined,
  };
}

function shouldProvideCredentialsSupport(
  options: Pick<WhoamiNestModuleOptions, "userRepository" | "configuration">,
): boolean {
  return Boolean(
    options.userRepository || options.configuration?.authMethods?.credentials,
  );
}

function shouldProvideRefreshTokenSupport(
  options: Pick<
    WhoamiNestModuleOptions,
    "refreshTokenRepository" | "configuration"
  >,
): boolean {
  return Boolean(
    options.refreshTokenRepository ||
    options.configuration?.refreshTokens?.enabled,
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
      WHOAMI_USER_REPOSITORY,
      WHOAMI_GOOGLE_USER_REPOSITORY,
      WHOAMI_REFRESH_TOKEN_REPOSITORY,
      WHOAMI_PASSWORD_HASHER,
      WHOAMI_TOKEN_HASHER,
      WHOAMI_TOKEN_SIGNER,
      WHOAMI_GOOGLE_ID_TOKEN_VERIFIER,
      WHOAMI_LOGGER,
      WHOAMI_CONFIGURATION,
    ],
  };
}

@Module({})
export class WhoamiModule {
  static register(options: WhoamiNestModuleOptions): DynamicModule {
    const providers: Provider[] = [
      provideOptionalClass(WHOAMI_USER_REPOSITORY, options.userRepository),
      provideOptionalClass(
        WHOAMI_GOOGLE_USER_REPOSITORY,
        options.googleUserRepository,
      ),
      provideOptionalClass(
        WHOAMI_REFRESH_TOKEN_REPOSITORY,
        options.refreshTokenRepository,
      ),
      provideOptionalClass(
        WHOAMI_PASSWORD_HASHER,
        shouldProvideCredentialsSupport(options)
          ? (options.passwordHasher ?? Argon2PasswordHasher)
          : undefined,
      ),
      provideOptionalClass(
        WHOAMI_TOKEN_HASHER,
        shouldProvideRefreshTokenSupport(options)
          ? (options.tokenHasher ?? WebCryptoTokenHasher)
          : undefined,
      ),
      provideOptionalClass(
        WHOAMI_GOOGLE_ID_TOKEN_VERIFIER,
        options.googleIdTokenVerifier,
      ),
      {
        provide: WHOAMI_CONFIGURATION,
        useValue: options.configuration,
      },
      {
        provide: WHOAMI_TOKEN_SIGNER,
        useFactory: (): ITokenSigner => {
          if (options.tokenSigner) {
            return new options.tokenSigner();
          }

          if (options.tokenSignerOptions) {
            return new JoseTokenSigner(options.tokenSignerOptions);
          }

          throw new Error(
            "WhoamiModule requires either tokenSigner or tokenSignerOptions.",
          );
        },
      },
      {
        provide: WHOAMI_TOKEN_EXTRACTOR,
        useClass: options.tokenExtractor ?? BearerTokenExtractor,
      },
      {
        provide: WHOAMI_LOGGER,
        useFactory: (): ILogger => {
          if (options.logger) {
            return new options.logger();
          }
          return new NestLoggerAdapter("WhoamiModule");
        },
      },
      WhoamiAuthGuard,
      createWhoamiServiceProvider(),
    ];

    return {
      module: WhoamiModule,
      controllers: resolveController(options.controller),
      providers,
      exports: [
        WhoamiService,
        WhoamiAuthGuard,
        WHOAMI_TOKEN_EXTRACTOR,
        WHOAMI_CONFIGURATION,
      ],
    };
  }

  static registerAsync(options: WhoamiNestModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      provideAsyncOptional(WHOAMI_USER_REPOSITORY, options.userRepository),
      provideAsyncOptional(
        WHOAMI_GOOGLE_USER_REPOSITORY,
        options.googleUserRepository,
      ),
      provideAsyncOptional(
        WHOAMI_REFRESH_TOKEN_REPOSITORY,
        options.refreshTokenRepository,
      ),
      provideAsyncOptional(WHOAMI_CONFIGURATION, options.configuration),
      provideAsyncOptional(
        WHOAMI_GOOGLE_ID_TOKEN_VERIFIER,
        options.googleIdTokenVerifier,
      ),
    ];

    if (options.passwordHasher) {
      providers.push(
        provideAsyncOptional(WHOAMI_PASSWORD_HASHER, options.passwordHasher),
      );
    } else if (
      options.userRepository ||
      options.configuration?.useValue?.authMethods?.credentials
    ) {
      providers.push({
        provide: WHOAMI_PASSWORD_HASHER,
        useClass: Argon2PasswordHasher,
      });
    } else {
      providers.push({
        provide: WHOAMI_PASSWORD_HASHER,
        useValue: undefined,
      });
    }

    if (options.tokenHasher) {
      providers.push(
        provideAsyncOptional(WHOAMI_TOKEN_HASHER, options.tokenHasher),
      );
    } else if (
      options.refreshTokenRepository ||
      options.configuration?.useValue?.refreshTokens?.enabled
    ) {
      providers.push({
        provide: WHOAMI_TOKEN_HASHER,
        useClass: WebCryptoTokenHasher,
      });
    } else {
      providers.push({
        provide: WHOAMI_TOKEN_HASHER,
        useValue: undefined,
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
        useFactory: (): ITokenSigner => {
          throw new Error(
            "WhoamiModule requires either tokenSigner or tokenSignerOptions.",
          );
        },
      });
    }

    if (options.tokenExtractor) {
      providers.push(
        provideAsyncOptional(WHOAMI_TOKEN_EXTRACTOR, options.tokenExtractor),
      );
    } else {
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
      exports: [
        WhoamiService,
        WhoamiAuthGuard,
        WHOAMI_TOKEN_EXTRACTOR,
        WHOAMI_CONFIGURATION,
      ],
    };
  }
}
