import { DynamicModule, Module, Provider } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  VerifyReceiptUseCase,
  type ReceiptVerifier,
} from "@odysseon/whoami-core";
import { WhoamiAuthGuard } from "./guards/whoami-auth.guard.js";
import { WhoamiExceptionFilter } from "./filters/whoami-exception.filter.js";
import { BearerTokenExtractor } from "./extractors/bearer-token.extractor.js";

/**
 * Static options for `WhoamiModule.register`.
 * @public
 */
export interface WhoamiModuleOptions {
  /** The receipt verifier implementation (e.g. `JoseReceiptVerifier`). */
  verifier: ReceiptVerifier;
}

/**
 * Async options factory for `WhoamiModule.registerAsync`.
 * @public
 */
export interface WhoamiModuleAsyncOptions {
  /** Modules to import whose providers are needed by `useFactory`. */
  imports?: DynamicModule["imports"];
  /** Factory that returns {@link WhoamiModuleOptions}. */
  useFactory: (
    ...args: unknown[]
  ) => WhoamiModuleOptions | Promise<WhoamiModuleOptions>;
  /** Providers injected into `useFactory`. */
  inject?: Provider[];
}

/**
 * NestJS integration module for `@odysseon/whoami-core`.
 *
 * Registers `VerifyReceiptUseCase`, `WhoamiAuthGuard`, `WhoamiExceptionFilter`,
 * and `BearerTokenExtractor` as injectable providers.
 *
 * @example
 * ```ts
 * // Static
 * WhoamiModule.register({ verifier: new JoseReceiptVerifier(config) })
 *
 * // Async
 * WhoamiModule.registerAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService) => ({
 *     verifier: new JoseReceiptVerifier({ secret: config.get('JWT_SECRET') }),
 *   }),
 * })
 * ```
 *
 * @public
 */
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
    const asyncProvider: Provider = {
      provide: "WHOAMI_MODULE_OPTIONS",
      useFactory: options.useFactory,
      inject: (options.inject ?? []) as never[],
    };

    const verifyReceiptProvider: Provider = {
      provide: VerifyReceiptUseCase,
      useFactory: (opts: WhoamiModuleOptions) =>
        new VerifyReceiptUseCase(opts.verifier),
      inject: ["WHOAMI_MODULE_OPTIONS"],
    };

    const providers: Provider[] = [
      asyncProvider,
      verifyReceiptProvider,
      WhoamiAuthGuard,
      WhoamiExceptionFilter,
      BearerTokenExtractor,
      Reflector,
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
      WhoamiAuthGuard,
      WhoamiExceptionFilter,
      BearerTokenExtractor,
      Reflector,
    ];
  }
}
