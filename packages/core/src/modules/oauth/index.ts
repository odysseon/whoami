import type { AuthModule } from "../module.interface.js";
import type { AuthMethodPort } from "../../kernel/auth/auth-method.port.js";
import type { AuthMethodRemover } from "../../kernel/auth/usecases/remove-auth-method.usecase.js";
import type { CoreContext } from "../../composition/context-builder.js";
import type { OAuthCredentialStore } from "./ports/oauth-credential.store.port.js";
import type { PasswordCredentialStore } from "../password/ports/password-credential.store.port.js";
import type { AccountId } from "../../kernel/shared/index.js";
import type { Receipt } from "../../kernel/receipt/receipt.entity.js";
import {
  OAuthProviderNotFoundError,
  CannotRemoveLastCredentialError,
} from "../../kernel/shared/index.js";

import { AuthenticateWithOAuthUseCase } from "./usecases/authenticate.usecase.js";
import { LinkOAuthToAccountUseCase } from "./usecases/link-account.usecase.js";
import { UnlinkOAuthUseCase } from "./usecases/unlink-account.usecase.js";

export interface OAuthConfig {
  oauthStore: OAuthCredentialStore;
  /**
   * Optional: provide to enable last-credential check when unlinking OAuth.
   * Without this, the module cannot verify a password fallback exists.
   */
  passwordStore?: PasswordCredentialStore;
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
  unlinkOAuthFromAccount(input: {
    accountId: AccountId;
    provider: string;
  }): Promise<void>;
}

export const OAuthModule: AuthModule<OAuthConfig, OAuthMethods> = {
  key: "oauth",

  create(config: OAuthConfig, ctx: CoreContext): OAuthMethods {
    const { oauthStore, passwordStore } = config;
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

    const unlinkUC = new UnlinkOAuthUseCase({
      oauthStore,
      ...(passwordStore ? { passwordStore } : {}),
    });

    return {
      authenticateWithOAuth: (input): Promise<Receipt> =>
        authenticateUC.execute(input),
      linkOAuthToAccount: (input): Promise<void> => linkUC.execute(input),
      unlinkOAuthFromAccount: (input): Promise<void> => unlinkUC.execute(input),
    };
  },

  buildAuthMethodPort(config: OAuthConfig): AuthMethodPort {
    return {
      method: "oauth",
      exists: (accountId): Promise<boolean> =>
        config.oauthStore.existsForAccount(accountId),
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
          const target = all.find((c) => c.oauthProvider === provider);
          if (!target) throw new OAuthProviderNotFoundError(provider);

          const remaining = all.length - 1;
          const hasPassword = config.passwordStore
            ? await config.passwordStore.existsForAccount(accountId)
            : false;
          if (remaining === 0 && !hasPassword)
            throw new CannotRemoveLastCredentialError();

          await config.oauthStore.deleteByProvider(accountId, provider);
        } else {
          await config.oauthStore.deleteAllForAccount(accountId);
        }
      },
    };
  },
};
