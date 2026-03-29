import {
  DynamicModule,
  Module,
  Provider,
  type ForwardReference,
  type InjectionToken,
  type OptionalFactoryDependency,
  type Type,
} from "@nestjs/common";
import {
  AuthenticateOAuthUseCase,
  IssueReceiptUseCase,
  type AccountRepository,
  type CredentialStore,
  type LoggerPort,
  type ReceiptSigner,
} from "@odysseon/whoami-core";
import { OAuthCallbackHandler } from "./oauth-callback-handler.js";

/**
 * Options for registering the OAuth authentication flow.
 */
export interface WhoamiOAuthModuleOptions {
  /**
   * Your `AccountRepository` implementation.
   */
  accountRepository: AccountRepository;

  /**
   * Your `CredentialStore` implementation.
   */
  credentialStore: CredentialStore;

  /**
   * The receipt signer — use `JoseReceiptSigner` from `@odysseon/whoami-adapter-jose`.
   */
  receiptSigner: ReceiptSigner;

  /**
   * Returns a unique `string` or `number` for each call.
   * @example () => crypto.randomUUID()
   */
  generateId: () => string | number;

  /**
   * Receipt token lifespan in minutes. Defaults to `60`.
   */
  tokenLifespanMinutes?: number;

  /**
   * Optional structured logger. Defaults to a no-op logger.
   */
  logger?: LoggerPort;
}

export const WHOAMI_OAUTH_MODULE_OPTIONS = "WHOAMI_OAUTH_MODULE_OPTIONS";

const noOpLogger: LoggerPort = {
  info: () => {},
  warn: () => {},
  error: () => {},
};

/**
 * Registers all OAuth authentication providers in a single `registerAsync` call.
 *
 * Exposes `OAuthCallbackHandler` as the single entry point for OAuth callbacks —
 * call `handler.handle(profile)` and get back a signed `Receipt`.
 *
 * Use alongside `WhoamiModule` (which handles receipt verification for protected routes).
 *
 * @example
 * ```ts
 * // app.module.ts
 * WhoamiOAuthModule.registerAsync({
 *   imports: [ConfigModule, DatabaseModule],
 *   inject: [ConfigService, AccountRepositoryToken, CredentialStoreToken],
 *   useFactory: (config, accountRepository, credentialStore) => ({
 *     accountRepository,
 *     credentialStore,
 *     receiptSigner: new JoseReceiptSigner({ secret: config.get('JWT_SECRET') }),
 *     generateId: () => crypto.randomUUID(),
 *     tokenLifespanMinutes: 60,
 *   }),
 * })
 * ```
 */
@Module({})
export class WhoamiOAuthModule {
  public static registerAsync(options: {
    imports?: Array<
      Type<unknown> | ForwardReference | DynamicModule | Promise<DynamicModule>
    >;
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    useFactory: (
      ...args: unknown[]
    ) => Promise<WhoamiOAuthModuleOptions> | WhoamiOAuthModuleOptions;
  }): DynamicModule {
    const optionsProvider: Provider = {
      provide: WHOAMI_OAUTH_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };

    const authenticateOAuthProvider: Provider = {
      provide: AuthenticateOAuthUseCase,
      useFactory: (opts: WhoamiOAuthModuleOptions): AuthenticateOAuthUseCase =>
        new AuthenticateOAuthUseCase({
          accountRepository: opts.accountRepository,
          credentialStore: opts.credentialStore,
          generateId: opts.generateId,
          logger: opts.logger ?? noOpLogger,
        }),
      inject: [WHOAMI_OAUTH_MODULE_OPTIONS],
    };

    const issueReceiptProvider: Provider = {
      provide: IssueReceiptUseCase,
      useFactory: (opts: WhoamiOAuthModuleOptions): IssueReceiptUseCase =>
        new IssueReceiptUseCase({
          signer: opts.receiptSigner,
          tokenLifespanMinutes: opts.tokenLifespanMinutes,
        }),
      inject: [WHOAMI_OAUTH_MODULE_OPTIONS],
    };

    const oauthCallbackHandlerProvider: Provider = {
      provide: OAuthCallbackHandler,
      useFactory: (
        authenticateOAuth: AuthenticateOAuthUseCase,
        issueReceipt: IssueReceiptUseCase,
      ): OAuthCallbackHandler =>
        new OAuthCallbackHandler(authenticateOAuth, issueReceipt),
      inject: [AuthenticateOAuthUseCase, IssueReceiptUseCase],
    };

    return {
      module: WhoamiOAuthModule,
      imports: options.imports ?? [],
      providers: [
        optionsProvider,
        authenticateOAuthProvider,
        issueReceiptProvider,
        oauthCallbackHandlerProvider,
      ],
      exports: [
        OAuthCallbackHandler,
        AuthenticateOAuthUseCase,
        IssueReceiptUseCase,
      ],
    };
  }
}
