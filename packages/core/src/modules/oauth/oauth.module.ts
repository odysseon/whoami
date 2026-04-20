import type {
  AuthModule,
  CredentialProofDeserializer,
} from "../../kernel/ports/auth-module.port.js";
import type { CredentialProof } from "../../kernel/domain/entities/credential.js";
import type {
  CredentialId,
  AccountId,
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

/**
 * Deserializer for OAuth proofs
 */
class OAuthProofDeserializer implements CredentialProofDeserializer {
  readonly kind = "oauth";

  deserialize(data: unknown): CredentialProof {
    if (data === null || typeof data !== "object") {
      throw new Error("OAuth proof must be an object");
    }

    const proof = data as Record<string, unknown>;

    if (proof.kind !== "oauth") {
      throw new Error(`Expected kind 'oauth' but got '${proof.kind}'`);
    }

    if (typeof proof.provider !== "string") {
      throw new Error("OAuth proof must have a provider string");
    }

    if (typeof proof.providerId !== "string") {
      throw new Error("OAuth proof must have a providerId string");
    }

    return {
      kind: "oauth",
      provider: proof.provider,
      providerId: proof.providerId,
    } as CredentialProof;
  }
}

/**
 * Creates the OAuth authentication module.
 * Zero imports from other modules - total independence.
 */
export function OAuthModule(
  config: OAuthModuleConfig,
): AuthModule<OAuthMethods> {
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

  // Create methods object
  const methods: OAuthMethods = {
    authenticateWithOAuth: async (input) => {
      const result = await authenticateUseCase.execute(input);
      return result;
    },

    linkOAuthToAccount: async (input) => {
      const result = await linkUseCase.execute({
        accountId: input.accountId as unknown as AccountId,
        provider: input.provider,
        providerId: input.providerId,
      });
      return result;
    },

    unlinkProvider: async (accountId, provider) => {
      await unlinkUseCase.execute({
        accountId: accountId as unknown as AccountId,
        provider,
      });
    },
  };

  return {
    kind: "oauth",
    proofDeserializer: new OAuthProofDeserializer(),
    methods,

    // Implement AuthModule interface
    async countCredentialsForAccount(accountId: string): Promise<number> {
      return await config.oauthStore.countForAccount(
        accountId as unknown as AccountId,
      );
    },

    async removeCredential(credentialId: CredentialId): Promise<void> {
      await config.oauthStore.delete(credentialId);
    },

    async removeAllCredentialsForAccount(accountId: string): Promise<void> {
      await config.oauthStore.deleteAllForAccount(
        accountId as unknown as AccountId,
      );
    },
  };
}
