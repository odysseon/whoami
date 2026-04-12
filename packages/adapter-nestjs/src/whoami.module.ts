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
import {
  createAuth,
  type AuthConfig,
  type AnyAuthMethods,
  type ReceiptVerifier,
  InvalidConfigurationError,
} from "@odysseon/whoami-core";
import { WhoamiAuthGuard } from "./guards/whoami-auth.guard.js";
import { WhoamiExceptionFilter } from "./filters/whoami-exception.filter.js";
import { BearerTokenExtractor } from "./extractors/bearer-token.extractor.js";
import { AuthTokenExtractor } from "./extractors/auth-token-extractor.port.js";
import { OAuthCallbackHandler } from "./oauth/oauth-callback-handler.js";
import { AUTH_METHODS, VERIFY_RECEIPT } from "./tokens.js";
export { AUTH_METHODS, VERIFY_RECEIPT } from "./tokens.js";

/**
 * Supply the full {@link AuthConfig} and let {@link WhoamiModule} call
 * `createAuth` internally, **or** supply a pre-built {@link AuthMethods}
 * facade (e.g. one already composed in another module) via `auth`.
 *
 * The second form avoids re-constructing use-cases when the facade is already
 * available in the DI container.
 *
 * In both cases `receiptVerifier` must be supplied so the guard can verify
 * tokens independently of the facade.
 *
 * @public
 */
export type WhoamiModuleOptions = (
  | (AuthConfig & { auth?: never })
  | { auth: AnyAuthMethods; receiptVerifier: ReceiptVerifier }
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

function isReceiptVerifier(obj: unknown): obj is ReceiptVerifier {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "verify" in obj &&
    typeof (obj as Record<string, unknown>)["verify"] === "function"
  );
}

function resolveAuth(opts: WhoamiModuleOptions): AnyAuthMethods {
  return "auth" in opts && opts.auth !== undefined
    ? opts.auth
    : createAuth(opts as AuthConfig);
}

function resolveVerifier(opts: WhoamiModuleOptions): ReceiptVerifier {
  const verifier =
    "receiptVerifier" in opts
      ? opts.receiptVerifier
      : (opts as AuthConfig).receiptVerifier;

  if (!isReceiptVerifier(verifier)) {
    throw new InvalidConfigurationError(
      "receiptVerifier must be a valid ReceiptVerifier implementation with a verify() method. " +
        "Example: new JoseReceiptVerifier({ secret, issuer })",
    );
  }

  return verifier;
}

@Global()
@Module({})
export class WhoamiModule {
  static register(options: WhoamiModuleOptions): DynamicModule {
    const verifier = resolveVerifier(options);
    const auth = resolveAuth(options);
    const providers = WhoamiModule.buildProviders(options, { verifier, auth });
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
      useFactory: (opts: WhoamiModuleOptions): AnyAuthMethods =>
        resolveAuth(opts),
      inject: ["WHOAMI_MODULE_OPTIONS"],
    };

    const receiptVerifierProvider: FactoryProvider = {
      provide: VERIFY_RECEIPT,
      useFactory: (opts: WhoamiModuleOptions): ReceiptVerifier =>
        resolveVerifier(opts),
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
      receiptVerifierProvider,
      tokenExtractorProvider,
      bearerTokenExtractorAliasProvider,
      WhoamiAuthGuard,
      WhoamiExceptionFilter,
      OAuthCallbackHandler,
    ];

    return {
      module: WhoamiModule,
      imports: options.imports ?? [],
      providers,
      exports: providers,
    };
  }

  private static buildProviders(
    options: WhoamiModuleOptions,
    resolved?: { verifier: ReceiptVerifier; auth: AnyAuthMethods },
  ): Provider[] {
    const verifier = resolved?.verifier ?? resolveVerifier(options);
    const auth = resolved?.auth ?? resolveAuth(options);

    return [
      {
        provide: AUTH_METHODS,
        useValue: auth,
      },
      {
        provide: VERIFY_RECEIPT,
        useValue: verifier,
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
      OAuthCallbackHandler,
    ];
  }
}
