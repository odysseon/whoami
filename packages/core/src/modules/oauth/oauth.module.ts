import type {
  AuthModule,
  CredentialProofDeserializer,
} from "../../kernel/ports/auth-module.port.js";
import type { CredentialProof } from "../../kernel/domain/entities/credential.js";
import { requireAccountId } from "../../kernel/shared/validation.js";
import { buildAuthLifecycle } from "../../kernel/shared/auth-lifecycle.js";
import {
  AuthenticateWithOAuthUseCase,
  LinkOAuthToAccountUseCase,
  UnlinkOAuthProviderUseCase,
} from "./use-cases/index.js";
import type { OAuthModuleConfig, OAuthMethods } from "./oauth.config.js";

export type { OAuthModuleConfig, OAuthMethods };

function assertObject(data: unknown): asserts data is Record<string, unknown> {
  if (data === null || typeof data !== "object") {
    throw new Error("OAuth proof must be an object");
  }
}

function credentialProof<T extends CredentialProof>(proof: T): CredentialProof {
  return proof;
}

class OAuthProofDeserializer implements CredentialProofDeserializer {
  readonly kind = "oauth";

  deserialize(data: unknown): CredentialProof {
    assertObject(data);

    if (data["kind"] !== "oauth") {
      throw new Error(
        `Expected kind 'oauth' but got '${String(data["kind"])}'`,
      );
    }

    if (typeof data["provider"] !== "string") {
      throw new Error("OAuth proof must have a provider string");
    }

    if (typeof data["providerId"] !== "string") {
      throw new Error("OAuth proof must have a providerId string");
    }

    return credentialProof({
      kind: "oauth",
      provider: data["provider"],
      providerId: data["providerId"],
    });
  }
}

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
