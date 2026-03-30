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
  OAuthCallbackHandler,
  type AccountRepository,
  type CredentialStore,
  type LoggerPort,
  type ReceiptSigner,
} from "@odysseon/whoami-core";

export interface WhoamiOAuthModuleOptions {
  accountRepository: AccountRepository;
  credentialStore: CredentialStore;
  receiptSigner: ReceiptSigner;
  generateId: () => string | number;
  tokenLifespanMinutes?: number;
  logger?: LoggerPort;
}

export const WHOAMI_OAUTH_MODULE_OPTIONS = "WHOAMI_OAUTH_MODULE_OPTIONS";

const noOpLogger: LoggerPort = {
  info: (): void => {},
  warn: (): void => {},
  error: (): void => {},
};

/**
 * Registers all OAuth authentication providers in a single `registerAsync` call.
 *
 * `OAuthCallbackHandler` is sourced from `@odysseon/whoami-core` — framework-agnostic.
 * This module only handles NestJS DI wiring.
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
