import {
  AuthenticateWithOAuthUseCase,
  LinkOAuthToAccountUseCase,
  UnlinkOAuthProviderUseCase,
} from "./use-cases/index.js";
import type { OAuthModuleConfig } from "./oauth.config.js";

export interface OAuthUseCases {
  readonly authenticate: AuthenticateWithOAuthUseCase;
  readonly link: LinkOAuthToAccountUseCase;
  readonly unlink: UnlinkOAuthProviderUseCase;
}

export function buildOAuthUseCases(
  config: OAuthModuleConfig,
  tokenLifespanMinutes: number,
): OAuthUseCases {
  return {
    authenticate: new AuthenticateWithOAuthUseCase({
      accountRepo: config.accountRepo,
      oauthStore: config.oauthStore,
      receiptSigner: config.receiptSigner,
      idGenerator: config.idGenerator,
      logger: config.logger,
      tokenLifespanMinutes,
    }),

    link: new LinkOAuthToAccountUseCase({
      accountRepo: config.accountRepo,
      oauthStore: config.oauthStore,
      idGenerator: config.idGenerator,
      logger: config.logger,
    }),

    unlink: new UnlinkOAuthProviderUseCase({
      oauthStore: config.oauthStore,
    }),
  };
}
