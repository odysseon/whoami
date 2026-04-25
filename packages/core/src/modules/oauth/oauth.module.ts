import type {
  AuthModule,
  CredentialProofDeserializer,
} from "../../kernel/ports/auth-module.port.js";
import type { CredentialProof } from "../../kernel/domain/entities/credential.js";
import {
  type CredentialId,
  createAccountId,
} from "../../kernel/domain/value-objects/index.js";
import type { AccountRepository } from "../../kernel/ports/account-repository.port.js";
import type { ReceiptSigner } from "../../kernel/ports/receipt-signer.port.js";
import type {
  IdGeneratorPort,
  LoggerPort,
} from "../../kernel/ports/shared-ports.port.js";
import type { OAuthCredentialStore } from "./ports/oauth-credential-store.port.js";
import {
  AuthenticateWithOAuthUseCase,
  LinkOAuthToAccountUseCase,
  UnlinkOAuthProviderUseCase,
  type AuthenticateWithOAuthOutput,
} from "./use-cases/index.js";

/**
 * Configuration for the OAuth module
 */
export interface OAuthModuleConfig {
  readonly accountRepo: AccountRepository;
  readonly oauthStore: OAuthCredentialStore;
  readonly receiptSigner: ReceiptSigner;
  readonly idGenerator: IdGeneratorPort;
  readonly logger: LoggerPort;
  readonly tokenLifespanMinutes?: number;
}

/**
 * Methods exposed by the OAuth module
 */
export interface OAuthMethods {
  readonly authenticateWithOAuth: (input: {
    provider: string;
    providerId: string;
    email: string;
  }) => Promise<AuthenticateWithOAuthOutput>;

  readonly linkOAuthToAccount: (input: {
    accountId: string;
    provider: string;
    providerId: string;
  }) => Promise<{ success: true }>;

  readonly unlinkProvider: (
    accountId: string,
    provider: string,
  ) => Promise<void>;
}

function assertObject(data: unknown): asserts data is Record<string, unknown> {
  if (data === null || typeof data !== "object") {
    throw new Error("OAuth proof must be an object");
  }
}

function credentialProof<T extends CredentialProof>(proof: T): CredentialProof {
  return proof;
}

/**
 * Deserializer for OAuth proofs
 */
class OAuthProofDeserializer implements CredentialProofDeserializer {
  readonly kind = "oauth";

  deserialize(data: unknown): CredentialProof {
    assertObject(data);

    if (data.kind !== "oauth") {
      throw new Error(`Expected kind 'oauth' but got '${String(data.kind)}'`);
    }

    if (typeof data.provider !== "string") {
      throw new Error("OAuth proof must have a provider string");
    }

    if (typeof data.providerId !== "string") {
      throw new Error("OAuth proof must have a providerId string");
    }

    return credentialProof({
      kind: "oauth",
      provider: data.provider,
      providerId: data.providerId,
    });
  }
}

/**
 * Creates the OAuth authentication module.
 * Zero imports from other modules - total independence.
 */
export function OAuthModule(
  config: OAuthModuleConfig,
): OAuthMethods & AuthModule {
  const tokenLifespanMinutes = config.tokenLifespanMinutes ?? 60;

  // Create use cases
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

  return {
    kind: "oauth",
    proofDeserializer: new OAuthProofDeserializer(),

    authenticateWithOAuth: async (
      input,
    ): Promise<AuthenticateWithOAuthOutput> => {
      const result = await authenticateUseCase.execute(input);
      return result;
    },

    linkOAuthToAccount: async (input): Promise<{ success: true }> => {
      const result = await linkUseCase.execute({
        accountId: createAccountId(input.accountId),
        provider: input.provider,
        providerId: input.providerId,
      });
      return result;
    },

    unlinkProvider: async (accountId, provider): Promise<void> => {
      await unlinkUseCase.execute({
        accountId: createAccountId(accountId),
        provider,
      });
    },

    // AuthModule lifecycle interface
    async countCredentialsForAccount(accountId: string): Promise<number> {
      return await config.oauthStore.countForAccount(
        createAccountId(accountId),
      );
    },

    async removeCredential(credentialId: CredentialId): Promise<void> {
      await config.oauthStore.delete(credentialId);
    },

    async removeAllCredentialsForAccount(
      accountId: string,
      options?: { provider?: string },
    ): Promise<void> {
      if (options?.provider) {
        await config.oauthStore.deleteByProvider(
          createAccountId(accountId),
          options.provider,
        );
      } else {
        await config.oauthStore.deleteAllForAccount(createAccountId(accountId));
      }
    },
  };
}
