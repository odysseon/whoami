import {
  DynamicModule,
  Module,
  Provider,
  FactoryProvider,
  Type,
  ForwardReference,
  InjectionToken,
  OptionalFactoryDependency,
} from "@nestjs/common";
import {
  VerifyReceiptUseCase,
  type ReceiptVerifier,
} from "@odysseon/whoami-core";
import { WhoamiAuthGuard } from "./guards/whoami-auth.guard.js";
import { WhoamiExceptionFilter } from "./filters/whoami-exception.filter.js";
import { BearerTokenExtractor } from "./extractors/bearer-token.extractor.js";
import { AuthTokenExtractor } from "./extractors/auth-token-extractor.port.js";

/**
 * Options for configuring the NestJS receipt-auth module.
 */
export interface WhoamiModuleOptions {
  /**
   * The receipt verifier implementation supplied by an adapter package.
   */
  verifier: ReceiptVerifier;

  /**
   * Optional token extractor override.
   */
  tokenExtractor?: AuthTokenExtractor;
}

export interface WhoamiModuleAsyncOptions {
  imports?: Array<
    Type<unknown> | ForwardReference | DynamicModule | Promise<DynamicModule>
  >;
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
  useFactory: (
    ...args: unknown[]
  ) => Promise<WhoamiModuleOptions> | WhoamiModuleOptions;
}

@Module({})
export class WhoamiModule {
  static register(options: WhoamiModuleOptions): DynamicModule {
    const providers = WhoamiModule.buildProviders(options);
    return {
      module: WhoamiModule,
      providers,
      exports: providers,
    };
  }

  static registerAsync(options: WhoamiModuleAsyncOptions): DynamicModule {
    const asyncProvider: FactoryProvider = {
      provide: "WHOAMI_MODULE_OPTIONS",
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };

    const verifyReceiptProvider: FactoryProvider = {
      provide: VerifyReceiptUseCase,
      useFactory: (opts: WhoamiModuleOptions) =>
        new VerifyReceiptUseCase(opts.verifier),
      inject: ["WHOAMI_MODULE_OPTIONS"],
    };

    const tokenExtractorProvider: FactoryProvider = {
      provide: AuthTokenExtractor,
      useFactory: (opts: WhoamiModuleOptions) =>
        opts.tokenExtractor ?? new BearerTokenExtractor(),
      inject: ["WHOAMI_MODULE_OPTIONS"],
    };

    const bearerTokenExtractorAliasProvider: Provider = {
      provide: BearerTokenExtractor,
      useExisting: AuthTokenExtractor,
    };

    const providers: Provider[] = [
      asyncProvider,
      verifyReceiptProvider,
      tokenExtractorProvider,
      bearerTokenExtractorAliasProvider,
      WhoamiAuthGuard,
      WhoamiExceptionFilter,
    ];

    return {
      module: WhoamiModule,
      imports: options.imports ?? [],
      providers,
      exports: providers,
    };
  }

  private static buildProviders(options: WhoamiModuleOptions): Provider[] {
    return [
      {
        provide: VerifyReceiptUseCase,
        useValue: new VerifyReceiptUseCase(options.verifier),
      },
      {
        provide: AuthTokenExtractor,
        useValue: options.tokenExtractor ?? new BearerTokenExtractor(),
      },
      {
        provide: BearerTokenExtractor,
        useExisting: AuthTokenExtractor,
      },
      WhoamiAuthGuard,
      WhoamiExceptionFilter,
    ];
  }
}
