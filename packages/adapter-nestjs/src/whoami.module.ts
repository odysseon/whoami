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
import { WhoamiNestModuleOptions } from "./types.js";

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
}
