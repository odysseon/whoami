import {
  DynamicModule,
  Global,
  Module,
  Provider,
  FactoryProvider,
  Type,
  ForwardReference,
  InjectionToken,
  OptionalFactoryDependency,
} from "@nestjs/common";
import { APP_GUARD, APP_FILTER } from "@nestjs/core";
import type { AuthModule, ReceiptVerifier } from "@odysseon/whoami-core";
import { WhoamiAuthGuard } from "./guards/whoami-auth.guard.js";
import { WhoamiExceptionFilter } from "./filters/whoami-exception.filter.js";
import { BearerTokenExtractor } from "./extractors/bearer-token.extractor.js";
import { AuthTokenExtractor } from "./extractors/auth-token-extractor.port.js";
import { OAuthCallbackHandler } from "./oauth/oauth-callback-handler.js";
import { WHOAMI_RECEIPT_VERIFIER, moduleToken } from "./tokens.js";

export * from "./tokens.js";

export interface WhoamiModuleOptions {
  readonly modules: readonly AuthModule[];
  readonly receiptVerifier: ReceiptVerifier;
  readonly tokenExtractor?: AuthTokenExtractor;
}

export interface WhoamiModuleAsyncOptions {
  readonly imports?: Array<
    Type<unknown> | ForwardReference | DynamicModule | Promise<DynamicModule>
  >;
  readonly inject?: Array<InjectionToken | OptionalFactoryDependency>;
  readonly useFactory: (
    ...args: unknown[]
  ) => Promise<WhoamiModuleOptions> | WhoamiModuleOptions;
}

@Global()
@Module({})
export class WhoamiModule {
  static register(options: WhoamiModuleOptions): DynamicModule {
    const providers = this.buildProviders(options);
    return {
      module: WhoamiModule,
      providers,
      exports: providers,
    };
  }

  static registerAsync(options: WhoamiModuleAsyncOptions): DynamicModule {
    const optionsProvider: FactoryProvider = {
      provide: "WHOAMI_OPTIONS",
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };

    const providers = this.buildAsyncProviders(optionsProvider);

    return {
      module: WhoamiModule,
      imports: options.imports ?? [],
      providers,
      exports: providers,
    };
  }

  private static buildProviders(options: WhoamiModuleOptions): Provider[] {
    const extractor = options.tokenExtractor ?? new BearerTokenExtractor();

    return [
      // Core port: receipt verifier
      { provide: WHOAMI_RECEIPT_VERIFIER, useValue: options.receiptVerifier },

      // Token extraction
      { provide: AuthTokenExtractor, useValue: extractor },

      // Per-module injection tokens — consumer injects PasswordMethods, OAuthMethods, etc.
      ...options.modules.map((mod) => ({
        provide: moduleToken(mod.kind),
        useValue: mod,
      })),

      // Guard — auto-registered globally. Consumer does NOT touch APP_GUARD.
      { provide: APP_GUARD, useClass: WhoamiAuthGuard },

      // Global exception filter
      { provide: APP_FILTER, useClass: WhoamiExceptionFilter },

      // OAuth handler — injectable anywhere, no consumer registration needed
      OAuthCallbackHandler,
    ];
  }

  private static buildAsyncProviders(
    optionsProvider: FactoryProvider,
  ): Provider[] {
    return [
      optionsProvider,

      {
        provide: WHOAMI_RECEIPT_VERIFIER,
        useFactory: (opts: WhoamiModuleOptions) => opts.receiptVerifier,
        inject: ["WHOAMI_OPTIONS"],
      },

      {
        provide: AuthTokenExtractor,
        useFactory: (opts: WhoamiModuleOptions) =>
          opts.tokenExtractor ?? new BearerTokenExtractor(),
        inject: ["WHOAMI_OPTIONS"],
      },

      {
        provide: "WHOAMI_MODULES",
        useFactory: (opts: WhoamiModuleOptions) => opts.modules,
        inject: ["WHOAMI_OPTIONS"],
      },

      // Auto-registered guard & filter
      { provide: APP_GUARD, useClass: WhoamiAuthGuard },
      { provide: APP_FILTER, useClass: WhoamiExceptionFilter },

      // OAuth handler — auto-wired
      OAuthCallbackHandler,
    ];
  }
}
