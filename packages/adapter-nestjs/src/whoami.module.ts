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
  createAuth,
  type AuthConfig,
  type AuthMethods,
} from "@odysseon/whoami-core";
import { VerifyReceiptUseCase } from "@odysseon/whoami-core/internal";
import { WhoamiAuthGuard } from "./guards/whoami-auth.guard.js";
import { WhoamiExceptionFilter } from "./filters/whoami-exception.filter.js";
import { BearerTokenExtractor } from "./extractors/bearer-token.extractor.js";
import { AuthTokenExtractor } from "./extractors/auth-token-extractor.port.js";

/**
 * DI token for the {@link AuthMethods} facade produced by {@link createAuth}.
 *
 * Inject it to call auth methods directly in your own services:
 *
 * ```ts
 * constructor(@Inject(AUTH_METHODS) private readonly auth: AuthMethods) {}
 * ```
 *
 * @public
 */
export const AUTH_METHODS = "WHOAMI_AUTH_METHODS" as const;

/**
 * Supply the full {@link AuthConfig} and let {@link WhoamiModule} call
 * `createAuth` internally, **or** supply a pre-built {@link AuthMethods}
 * facade (e.g. one already composed in another module) via `auth`.
 *
 * The second form avoids re-constructing use-cases when the facade is already
 * available in the DI container.
 *
 * @public
 */
export type WhoamiModuleOptions = (
  | (AuthConfig & { auth?: never })
  | { auth: AuthMethods; verifyReceipt: AuthConfig["verifyReceipt"] }
) & {
  /** Optional token extractor override. Defaults to {@link BearerTokenExtractor}. */
  tokenExtractor?: AuthTokenExtractor;
};

export interface WhoamiModuleAsyncOptions {
  imports?: Array<
    Type<unknown> | ForwardReference | DynamicModule | Promise<DynamicModule>
  >;
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
  useFactory: (
    ...args: unknown[]
  ) => Promise<WhoamiModuleOptions> | WhoamiModuleOptions;
}

function resolveAuth(opts: WhoamiModuleOptions): AuthMethods {
  return "auth" in opts && opts.auth !== undefined
    ? opts.auth
    : createAuth(opts as AuthConfig);
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

    const authMethodsProvider: FactoryProvider = {
      provide: AUTH_METHODS,
      useFactory: (opts: WhoamiModuleOptions): AuthMethods => resolveAuth(opts),
      inject: ["WHOAMI_MODULE_OPTIONS"],
    };

    const verifyReceiptProvider: FactoryProvider = {
      provide: VerifyReceiptUseCase,
      useFactory: (opts: WhoamiModuleOptions): VerifyReceiptUseCase =>
        opts.verifyReceipt,
      inject: ["WHOAMI_MODULE_OPTIONS"],
    };

    const tokenExtractorProvider: FactoryProvider = {
      provide: AuthTokenExtractor,
      useFactory: (opts: WhoamiModuleOptions): AuthTokenExtractor =>
        opts.tokenExtractor ?? new BearerTokenExtractor(),
      inject: ["WHOAMI_MODULE_OPTIONS"],
    };

    const bearerTokenExtractorAliasProvider: Provider = {
      provide: BearerTokenExtractor,
      useExisting: AuthTokenExtractor,
    };

    const providers: Provider[] = [
      asyncProvider,
      authMethodsProvider,
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
        provide: AUTH_METHODS,
        useValue: resolveAuth(options),
      },
      {
        provide: VerifyReceiptUseCase,
        useValue: options.verifyReceipt,
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
