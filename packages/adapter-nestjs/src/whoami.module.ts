import {
  DynamicModule,
  Global,
  Module,
  Provider,
  Logger,
  InjectionToken,
  OptionalFactoryDependency,
} from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import {
  WhoamiService,
  type IWhoamiAuthConfiguration,
  type IPasswordUserRepository,
  type IOAuthUserRepository,
  type IRefreshTokenRepository,
  type ITokenSigner,
  type IPasswordHasher,
  type IDeterministicTokenHasher,
  type ITokenExtractor,
} from "@odysseon/whoami-core";

import { WhoamiController } from "./whoami.controller.js";
import { WhoamiExceptionFilter } from "./filters/whoami-exception.filter.js";
import { BearerTokenExtractor } from "./extractors/bearer-token.extractor.js";
import { WHOAMI_TOKEN_EXTRACTOR } from "./guards/whoami-auth.guard.js";

export interface WhoamiModuleOptions {
  configuration?: IWhoamiAuthConfiguration;
  tokenSigner: ITokenSigner;
  passwordUserRepository?: IPasswordUserRepository;
  oauthUserRepository?: IOAuthUserRepository;
  refreshTokenRepository?: IRefreshTokenRepository;
  passwordHasher?: IPasswordHasher;
  tokenHasher?: IDeterministicTokenHasher;
  tokenExtractor?: ITokenExtractor;
}

export const WHOAMI_MODULE_OPTIONS = "WHOAMI_MODULE_OPTIONS";

@Global()
@Module({})
export class WhoamiModule {
  static registerAsync(options: {
    imports?: unknown[];
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    useFactory: (
      ...args: unknown[]
    ) => Promise<WhoamiModuleOptions> | WhoamiModuleOptions;
  }): DynamicModule {
    const optionsProvider: Provider = {
      provide: WHOAMI_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    const serviceProvider: Provider = {
      provide: WhoamiService,
      useFactory: (opts: WhoamiModuleOptions): WhoamiService => {
        const nestLogger = new Logger("WhoamiCore");

        const loggerAdapter = {
          info: (msg: unknown, ctx?: unknown): void => {
            nestLogger.log(msg, ctx);
          },
          error: (msg: unknown, ctx?: unknown): void => {
            nestLogger.error(msg, ctx);
          },
          warn: (msg: unknown, ctx?: unknown): void => {
            nestLogger.warn(msg, ctx);
          },
          debug: (msg: unknown, ctx?: unknown): void => {
            nestLogger.debug(msg, ctx);
          },
        };

        return new WhoamiService({
          configuration: opts.configuration,
          tokenSigner: opts.tokenSigner,
          logger: loggerAdapter,
          passwordUserRepository: opts.passwordUserRepository,
          oauthUserRepository: opts.oauthUserRepository,
          refreshTokenRepository: opts.refreshTokenRepository,
          passwordHasher: opts.passwordHasher,
          tokenHasher: opts.tokenHasher,
        });
      },
      inject: [WHOAMI_MODULE_OPTIONS],
    };

    return {
      module: WhoamiModule,
      imports:
        (options.imports as Array<import("@nestjs/common").DynamicModule>) ||
        [],
      controllers: [WhoamiController],
      providers: [
        optionsProvider,
        serviceProvider,
        {
          provide: WHOAMI_TOKEN_EXTRACTOR,
          useFactory: (opts: WhoamiModuleOptions): ITokenExtractor =>
            opts.tokenExtractor ?? new BearerTokenExtractor(),
          inject: [WHOAMI_MODULE_OPTIONS],
        },
        {
          provide: APP_FILTER,
          useClass: WhoamiExceptionFilter,
        },
      ],
      exports: [WhoamiService],
    };
  }
}
