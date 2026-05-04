import { requireAccountId } from "../../kernel/shared/validation.js";
import { buildAuthLifecycle } from "../../kernel/shared/auth-lifecycle.js";
import {
  AuthenticateWithOAuthUseCase,
  LinkOAuthToAccountUseCase,
  UnlinkOAuthProviderUseCase,
} from "./use-cases/index.js";
import { OAuthProofDeserializer } from "./oauth.deserializer.js";
import type { OAuthModuleConfig, OAuthMethods } from "./oauth.config.js";
import type { AuthModule } from "../../kernel/ports/auth-module.port.js";

export type { OAuthModuleConfig, OAuthMethods };

/** Creates the OAuth authentication module. */
export function OAuthModule(
  config: OAuthModuleConfig,
): OAuthMethods & AuthModule {
  const tokenLifespanMinutes = config.tokenLifespanMinutes ?? 60;

  const authenticateUseCase = new AuthenticateWithOAuthUseCase({
    accountRepo: config.accountRepo,
    oauthStore: config.oauthStore,
    receiptSigner: config.receiptSigner,
    idGenerator: config.idGenerator,
    logger: config.logger,
    tokenLifespanMinutes,
  });

  const linkUseCase = new LinkOAuthToAccountUseCase({
    accountRepo: config.accountRepo,
    oauthStore: config.oauthStore,
    idGenerator: config.idGenerator,
    logger: config.logger,
  });

  const unlinkUseCase = new UnlinkOAuthProviderUseCase({
    oauthStore: config.oauthStore,
  });

  const lifecycle = buildAuthLifecycle(config.oauthStore, {
    deleteByProvider: (accountId, provider) =>
      config.oauthStore.deleteByProvider(requireAccountId(accountId), provider),
  });

  return {
    kind: "oauth",
    proofDeserializer: new OAuthProofDeserializer(),

    authenticateWithOAuth: (input) => authenticateUseCase.execute(input),

    linkOAuthToAccount: (input) =>
      linkUseCase.execute({
        accountId: requireAccountId(input.accountId),
        provider: input.provider,
        providerId: input.providerId,
      }),

    unlinkProvider: async (accountId, provider): Promise<void> => {
      await unlinkUseCase.execute({
        accountId: requireAccountId(accountId),
        provider,
      });
    },

    ...lifecycle,
  };
}
