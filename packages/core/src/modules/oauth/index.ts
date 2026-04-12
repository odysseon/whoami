import type { AuthModule } from "../module.interface.js";
import type { AuthMethodPort } from "../../kernel/auth/auth-method.port.js";
import type { AuthMethodRemover } from "../../kernel/auth/usecases/remove-auth-method.usecase.js";
import type { CoreContext } from "../../composition/context-builder.js";
import type { OAuthCredentialStore } from "./ports/oauth-credential.store.port.js";
import type { Receipt } from "../../kernel/receipt/receipt.entity.js";
import type { AccountId } from "../../kernel/shared/index.js";
import { OAuthProviderNotFoundError } from "../../kernel/shared/index.js";

import { AuthenticateWithOAuthUseCase } from "./usecases/authenticate.usecase.js";
import { LinkOAuthToAccountUseCase } from "./usecases/link-account.usecase.js";

export interface OAuthConfig {
  oauthStore: OAuthCredentialStore;
}

export interface OAuthMethods {
  authenticateWithOAuth(input: {
    provider: string;
    providerId: string;
    email: string;
  }): Promise<Receipt>;
  linkOAuthToAccount(input: {
    receiptToken: string;
    provider: string;
    providerId: string;
    email: string;
  }): Promise<void>;
}

export const OAuthModule: AuthModule<OAuthConfig, OAuthMethods> = {
  key: "oauth",

  create(config: OAuthConfig, ctx: CoreContext): OAuthMethods {
    const { oauthStore } = config;
    const { accountRepo, issueReceipt, verifyReceipt, logger, idGenerator } =
      ctx;

    const authenticateUC = new AuthenticateWithOAuthUseCase({
      accountFinder: accountRepo,
      accountSaver: accountRepo,
      accountRemover: accountRepo,
      credentialFinder: oauthStore,
      credentialSaver: oauthStore,
      receiptIssuer: issueReceipt,
      idGenerator,
      logger,
    });

    const linkUC = new LinkOAuthToAccountUseCase({
      accountFinder: accountRepo,
      credentialFinder: oauthStore,
      credentialSaver: oauthStore,
      receiptVerifier: verifyReceipt,
      idGenerator,
      logger,
    });

    return {
      authenticateWithOAuth: (input): Promise<Receipt> =>
        authenticateUC.execute(input),
      linkOAuthToAccount: (input): Promise<void> => linkUC.execute(input),
    };
  },

  buildAuthMethodPort(config: OAuthConfig): AuthMethodPort {
    return {
      method: "oauth",
      exists: (accountId): Promise<boolean> =>
        config.oauthStore.existsForAccount(accountId),
      count: async (accountId): Promise<number> => {
        const all = await config.oauthStore.findAllByAccountId(accountId);
        return all.length;
      },
    };
  },

  buildAuthMethodRemover(config: OAuthConfig): AuthMethodRemover {
    return {
      method: "oauth",
      remove: async (
        accountId: AccountId,
        provider?: string,
      ): Promise<void> => {
        if (provider) {
          const all = await config.oauthStore.findAllByAccountId(accountId);
          const target = all.find((c): boolean => c.oauthProvider === provider);
          if (!target) throw new OAuthProviderNotFoundError(provider);

          await config.oauthStore.deleteByProvider(accountId, provider);
        } else {
          await config.oauthStore.deleteAllForAccount(accountId);
        }
      },
    };
  },
};
