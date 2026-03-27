import {
  DynamicModule,
  Global,
  Module,
  Provider,
  type ForwardReference,
  type InjectionToken,
  type OptionalFactoryDependency,
  type Type,
} from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import {
  VerifyReceiptUseCase,
  type ReceiptVerifier,
} from "@odysseon/whoami-core";
import type { AuthTokenExtractor } from "./extractors/auth-token-extractor.port.js";
import { BearerTokenExtractor } from "./extractors/bearer-token.extractor.js";
import { WhoamiExceptionFilter } from "./filters/whoami-exception.filter.js";
import { WHOAMI_TOKEN_EXTRACTOR } from "./guards/whoami-auth.guard.js";

/**
 * Options for configuring the NestJS receipt-auth module.
 */
export interface WhoamiModuleOptions {
  /**
   * The receipt verifier implementation supplied by an adapter package.
   */
  receiptVerifier: ReceiptVerifier;

  /**
   * Optional token extractor override.
   */
  tokenExtractor?: AuthTokenExtractor;
}

export const WHOAMI_MODULE_OPTIONS = "WHOAMI_MODULE_OPTIONS";

/**
 * Registers receipt-auth providers for NestJS applications.
 */
@Global()
@Module({})
export class WhoamiModule {
  /**
   * Registers the module asynchronously.
   *
   * @param options - The async registration options.
   * @returns A dynamic NestJS module.
   */
  public static registerAsync(options: {
    imports?: Array<
      Type<unknown> | ForwardReference | DynamicModule | Promise<DynamicModule>
    >;
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    useFactory: (
      ...args: unknown[]
    ) => Promise<WhoamiModuleOptions> | WhoamiModuleOptions;
  }): DynamicModule {
    const optionsProvider: Provider = {
      provide: WHOAMI_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };

    const verifyReceiptProvider: Provider = {
      provide: VerifyReceiptUseCase,
      useFactory: (moduleOptions: WhoamiModuleOptions): VerifyReceiptUseCase =>
        new VerifyReceiptUseCase(moduleOptions.receiptVerifier),
      inject: [WHOAMI_MODULE_OPTIONS],
    };

    return {
      module: WhoamiModule,
      imports: options.imports ?? [],
      providers: [
        optionsProvider,
        verifyReceiptProvider,
        {
          provide: WHOAMI_TOKEN_EXTRACTOR,
          useFactory: (
            moduleOptions: WhoamiModuleOptions,
          ): AuthTokenExtractor =>
            moduleOptions.tokenExtractor ?? new BearerTokenExtractor(),
          inject: [WHOAMI_MODULE_OPTIONS],
        },
        {
          provide: APP_FILTER,
          useClass: WhoamiExceptionFilter,
        },
      ],
      exports: [VerifyReceiptUseCase, WHOAMI_TOKEN_EXTRACTOR],
    };
  }
}
