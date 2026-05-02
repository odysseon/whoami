import type { AccountRepository } from "../../kernel/ports/account-repository.port.js";
import type { ReceiptSigner } from "../../kernel/ports/receipt-signer.port.js";
import type {
  IdGeneratorPort,
  LoggerPort,
} from "../../kernel/ports/shared-ports.port.js";
import type { OAuthCredentialStore } from "./ports/oauth-credential-store.port.js";
import type { AuthenticateWithOAuthOutput } from "./use-cases/index.js";

/** Configuration for the OAuth module */
export interface OAuthModuleConfig {
  readonly accountRepo: AccountRepository;
  readonly oauthStore: OAuthCredentialStore;
  readonly receiptSigner: ReceiptSigner;
  readonly idGenerator: IdGeneratorPort;
  readonly logger: LoggerPort;
  readonly tokenLifespanMinutes?: number;
}

/** Methods exposed by the OAuth module */
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
