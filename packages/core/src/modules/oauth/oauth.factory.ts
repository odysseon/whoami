import {
  AuthenticateWithOAuthUseCase,
  LinkOAuthToAccountUseCase,
  UnlinkOAuthProviderUseCase,
} from "./use-cases/index.js";
import type { OAuthModuleConfig } from "./oauth.config.js";
import { IssueReceiptUseCase } from "../../kernel/shared/issue-receipt.use-case.js";

export interface OAuthUseCases {
  readonly authenticate: AuthenticateWithOAuthUseCase;
  readonly link: LinkOAuthToAccountUseCase;
  readonly unlink: UnlinkOAuthProviderUseCase;
}

export function buildOAuthUseCases(
  config: OAuthModuleConfig,
  tokenLifespanMinutes: number,
): OAuthUseCases {
  const issueReceipt = new IssueReceiptUseCase({
    receiptSigner: config.receiptSigner,
    tokenLifespanMinutes,
  });

  return {
    authenticate: new AuthenticateWithOAuthUseCase({
      accountRepo: config.accountRepo,
      oauthStore: config.oauthStore,
      idGenerator: config.idGenerator,
      logger: config.logger,
      issueReceipt,
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
