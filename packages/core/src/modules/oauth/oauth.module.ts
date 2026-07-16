import { requireAccountId } from "../../kernel/shared/validation.js";
import { buildAuthLifecycle } from "../../kernel/shared/auth-lifecycle.js";
import { buildOAuthUseCases } from "./oauth.factory.js";
import { OAuthProofDeserializer } from "./oauth.deserializer.js";
import type { OAuthModuleConfig, OAuthMethods } from "./oauth.config.js";
import type { AuthModule } from "../../kernel/ports/auth-module.port.js";

export type { OAuthModuleConfig, OAuthMethods };

/** Creates the OAuth authentication module. */
export function OAuthModule(
  config: OAuthModuleConfig,
): OAuthMethods & AuthModule {
  const tokenLifespanMinutes = config.tokenLifespanMinutes ?? 60;

  const uc = buildOAuthUseCases(config, tokenLifespanMinutes);

  const lifecycle = buildAuthLifecycle(config.oauthStore, {
    deleteByProvider: (accountId, provider) =>
      config.oauthStore.deleteByProvider(requireAccountId(accountId), provider),
  });

  return {
    kind: "oauth",
    proofDeserializer: new OAuthProofDeserializer(),

    authenticateWithOAuth: (input) => uc.authenticate.execute(input),

    linkOAuthToAccount: (input) =>
      uc.link.execute({
        accountId: requireAccountId(input.accountId),
        provider: input.provider,
        providerId: input.providerId,
      }),

    unlinkProvider: async (accountId, provider): Promise<void> => {
      await uc.unlink.execute({
        accountId: requireAccountId(accountId),
        provider,
      });
    },

    ...lifecycle,
  };
}
