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
    const { providers, exports } = this.buildProviders(options);
    return {
      module: WhoamiModule,
      providers,
      exports,
    };
  }

  static registerAsync(options: WhoamiModuleAsyncOptions): DynamicModule {
    const optionsProvider: FactoryProvider = {
      provide: "WHOAMI_OPTIONS",
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };

    const { providers, exports } = this.buildAsyncProviders(optionsProvider);

    return {
      module: WhoamiModule,
      imports: options.imports ?? [],
      providers,
      exports,
    };
  }

  private static buildProviders(options: WhoamiModuleOptions): {
    providers: Provider[];
    exports: Provider[];
  } {
    const extractor = options.tokenExtractor ?? new BearerTokenExtractor();

    const coreProviders: Provider[] = [
      // Core port: receipt verifier
      { provide: WHOAMI_RECEIPT_VERIFIER, useValue: options.receiptVerifier },

      // Token extraction
      { provide: AuthTokenExtractor, useValue: extractor },

      // Per-module injection tokens — consumer injects PasswordMethods, OAuthMethods, etc.
      ...options.modules.map((mod) => ({
        provide: moduleToken(mod.kind),
        useValue: mod,
      })),

      {
        provide: moduleToken("oauth"),
        useValue: options.modules.find((mod) => mod.kind === "oauth") ?? null,
      },

      // OAuth handler — injectable anywhere, gracefully no-ops if OAuth is unconfigured
      OAuthCallbackHandler,
    ];

    const autoProviders: Provider[] = [
      // Guard — auto-registered globally. Consumer does NOT touch APP_GUARD.
      { provide: APP_GUARD, useClass: WhoamiAuthGuard },

      // Global exception filter
      { provide: APP_FILTER, useClass: WhoamiExceptionFilter },
    ];

    return {
      providers: [...coreProviders, ...autoProviders],
      exports: coreProviders,
    };
  }

  private static buildAsyncProviders(optionsProvider: FactoryProvider): {
    providers: Provider[];
    exports: Provider[];
  } {
    const coreProviders: Provider[] = [
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

      // Per-module injection tokens for async configuration
      {
        provide: moduleToken("password"),
        useFactory: (opts: WhoamiModuleOptions) =>
          opts.modules.find((mod) => mod.kind === "password") ?? null,
        inject: ["WHOAMI_OPTIONS"],
      },
      {
        provide: moduleToken("oauth"),
        useFactory: (opts: WhoamiModuleOptions) =>
          opts.modules.find((mod) => mod.kind === "oauth") ?? null,
        inject: ["WHOAMI_OPTIONS"],
      },
      {
        provide: moduleToken("magiclink"),
        useFactory: (opts: WhoamiModuleOptions) =>
          opts.modules.find((mod) => mod.kind === "magiclink") ?? null,
        inject: ["WHOAMI_OPTIONS"],
      },

      // OAuth handler — auto-wired, optional dependency
      OAuthCallbackHandler,
    ];

    const autoProviders: Provider[] = [
      // Auto-registered guard & filter
      { provide: APP_GUARD, useClass: WhoamiAuthGuard },
      { provide: APP_FILTER, useClass: WhoamiExceptionFilter },
    ];

    return {
      providers: [...coreProviders, ...autoProviders],
      exports: coreProviders,
    };
  }
}
