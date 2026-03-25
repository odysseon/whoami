import { DynamicModule, Module, Provider } from "@nestjs/common";
import type {
  IDeterministicTokenHasher,
  IEmailUserRepository,
  IRefreshTokenRepository,
  IPasswordHasher,
  ITokenSigner,
  ILogger,
  WhoamiServiceDependencies,
} from "@odysseon/whoami-core";
import { WhoamiService } from "@odysseon/whoami-core";
import { JoseTokenSigner } from "@odysseon/whoami-adapter-jose";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { WebCryptoTokenHasher } from "@odysseon/whoami-adapter-webcrypto";
import { NestLoggerAdapter } from "./nest-logger.adapter.js";
import {
  WHOAMI_LOGGER,
  WHOAMI_PASSWORD_HASHER,
  WHOAMI_REFRESH_TOKEN_REPOSITORY,
  WHOAMI_TOKEN_HASHER,
  WHOAMI_TOKEN_SIGNER,
  WHOAMI_USER_REPOSITORY,
} from "./constants.js";
import {
  WhoamiNestModuleAsyncOptions,
  WhoamiNestModuleOptions,
} from "./types.js";

@Module({})
export class WhoamiModule {
  static register(options: WhoamiNestModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: WHOAMI_USER_REPOSITORY,
        useClass: options.userRepository,
      },
      {
        provide: WHOAMI_REFRESH_TOKEN_REPOSITORY,
        useClass: options.refreshTokenRepository,
      },
      {
        provide: WHOAMI_PASSWORD_HASHER,
        useClass: options.passwordHasher ?? Argon2PasswordHasher,
      },
      {
        provide: WHOAMI_TOKEN_HASHER,
        useClass: options.tokenHasher ?? WebCryptoTokenHasher,
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
        provide: WHOAMI_LOGGER,
        useFactory: (): ILogger => {
          if (options.logger) {
            return new options.logger();
          }
          return new NestLoggerAdapter("WhoamiModule");
        },
      },
      {
        provide: WhoamiService,
        useFactory: (
          userRepository: IEmailUserRepository,
          refreshTokenRepository: IRefreshTokenRepository,
          passwordHasher: IPasswordHasher,
          tokenHasher: IDeterministicTokenHasher,
          tokenSigner: ITokenSigner,
          logger: ILogger,
        ): WhoamiService => {
          const deps: WhoamiServiceDependencies = {
            userRepository,
            refreshTokenRepository,
            passwordHasher,
            tokenHasher,
            tokenSigner,
            logger,
          };
          return new WhoamiService(deps);
        },
        inject: [
          WHOAMI_USER_REPOSITORY,
          WHOAMI_REFRESH_TOKEN_REPOSITORY,
          WHOAMI_PASSWORD_HASHER,
          WHOAMI_TOKEN_HASHER,
          WHOAMI_TOKEN_SIGNER,
          WHOAMI_LOGGER,
        ],
      },
    ];

    return {
      module: WhoamiModule,
      providers,
      exports: [WhoamiService],
    };
  }

  static registerAsync(options: WhoamiNestModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [];

    // User Repository
    if (options.userRepository.useClass) {
      providers.push({
        provide: WHOAMI_USER_REPOSITORY,
        useClass: options.userRepository.useClass,
      });
    } else if (options.userRepository.useFactory) {
      providers.push({
        provide: WHOAMI_USER_REPOSITORY,
        useFactory: options.userRepository.useFactory,
        inject: options.userRepository.inject ?? [],
      });
    } else if (options.userRepository.useExisting) {
      providers.push({
        provide: WHOAMI_USER_REPOSITORY,
        useExisting: options.userRepository.useExisting,
      });
    }

    // Refresh Token Repository
    if (options.refreshTokenRepository.useClass) {
      providers.push({
        provide: WHOAMI_REFRESH_TOKEN_REPOSITORY,
        useClass: options.refreshTokenRepository.useClass,
      });
    } else if (options.refreshTokenRepository.useFactory) {
      providers.push({
        provide: WHOAMI_REFRESH_TOKEN_REPOSITORY,
        useFactory: options.refreshTokenRepository.useFactory,
        inject: options.refreshTokenRepository.inject ?? [],
      });
    } else if (options.refreshTokenRepository.useExisting) {
      providers.push({
        provide: WHOAMI_REFRESH_TOKEN_REPOSITORY,
        useExisting: options.refreshTokenRepository.useExisting,
      });
    }

    // Password Hasher
    if (options.passwordHasher?.useClass) {
      providers.push({
        provide: WHOAMI_PASSWORD_HASHER,
        useClass: options.passwordHasher.useClass,
      });
    } else if (options.passwordHasher?.useFactory) {
      providers.push({
        provide: WHOAMI_PASSWORD_HASHER,
        useFactory: options.passwordHasher.useFactory,
        inject: options.passwordHasher.inject ?? [],
      });
    } else if (options.passwordHasher?.useExisting) {
      providers.push({
        provide: WHOAMI_PASSWORD_HASHER,
        useExisting: options.passwordHasher.useExisting,
      });
    } else {
      providers.push({
        provide: WHOAMI_PASSWORD_HASHER,
        useClass: Argon2PasswordHasher,
      });
    }

    // Token Hasher
    if (options.tokenHasher?.useClass) {
      providers.push({
        provide: WHOAMI_TOKEN_HASHER,
        useClass: options.tokenHasher.useClass,
      });
    } else if (options.tokenHasher?.useFactory) {
      providers.push({
        provide: WHOAMI_TOKEN_HASHER,
        useFactory: options.tokenHasher.useFactory,
        inject: options.tokenHasher.inject ?? [],
      });
    } else if (options.tokenHasher?.useExisting) {
      providers.push({
        provide: WHOAMI_TOKEN_HASHER,
        useExisting: options.tokenHasher.useExisting,
      });
    } else {
      providers.push({
        provide: WHOAMI_TOKEN_HASHER,
        useClass: WebCryptoTokenHasher,
      });
    }

    // Token Signer
    if (options.tokenSigner?.useClass) {
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
      providers.push({
        provide: WHOAMI_TOKEN_SIGNER,
        useFactory: (...args: unknown[]): ITokenSigner => {
          const config = options.tokenSignerOptions!.useFactory(...args);
          return new JoseTokenSigner(config);
        },
        inject: options.tokenSignerOptions.inject ?? [],
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

    // Logger
    if (options.logger?.useClass) {
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

    providers.push({
      provide: WhoamiService,
      useFactory: (
        userRepository: IEmailUserRepository,
        refreshTokenRepository: IRefreshTokenRepository,
        passwordHasher: IPasswordHasher,
        tokenHasher: IDeterministicTokenHasher,
        tokenSigner: ITokenSigner,
        logger: ILogger,
      ): WhoamiService => {
        const deps: WhoamiServiceDependencies = {
          userRepository,
          refreshTokenRepository,
          passwordHasher,
          tokenHasher,
          tokenSigner,
          logger,
        };
        return new WhoamiService(deps);
      },
      inject: [
        WHOAMI_USER_REPOSITORY,
        WHOAMI_REFRESH_TOKEN_REPOSITORY,
        WHOAMI_PASSWORD_HASHER,
        WHOAMI_TOKEN_HASHER,
        WHOAMI_TOKEN_SIGNER,
        WHOAMI_LOGGER,
      ],
    });

    return {
      module: WhoamiModule,
      providers,
      exports: [WhoamiService],
    };
  }
}
