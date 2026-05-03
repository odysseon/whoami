import type { AccountRepository } from "../../kernel/ports/account-repository.port.js";
import type { ReceiptSigner } from "../../kernel/ports/receipt-signer.port.js";
import type {
  IdGeneratorPort,
  LoggerPort,
} from "../../kernel/ports/shared-ports.port.js";
import type { OAuthCredentialStore } from "./ports/oauth-credential-store.port.js";
import type { Account, Receipt } from "../../kernel/domain/entities/index.js";
import type { AccountId } from "../../kernel/domain/value-objects/index.js";

/** Public account shape — no branded types */
export type AccountDTO = ReturnType<Account["toDTO"]>;

/** Public receipt shape — no branded types */
export type ReceiptDTO = ReturnType<Receipt["toDTO"]>;

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
  }) => Promise<{
    receipt: ReceiptDTO;
    account: AccountDTO;
    isNewAccount: boolean;
  }>;

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

// ─── DERIVED I/O TYPES ───

export type AuthenticateWithOAuthInput = Parameters<
  OAuthMethods["authenticateWithOAuth"]
>[0];
export type AuthenticateWithOAuthOutput = Awaited<
  ReturnType<OAuthMethods["authenticateWithOAuth"]>
>;

export type LinkOAuthToAccountInput = {
  readonly accountId: AccountId;
  readonly provider: string;
  readonly providerId: string;
};

export type LinkOAuthToAccountOutput = Awaited<
  ReturnType<OAuthMethods["linkOAuthToAccount"]>
>;

export type UnlinkOAuthProviderInput = {
  readonly accountId: AccountId;
  readonly provider: string;
};

// ─── DERIVED DEPS TYPES ───

export type AuthenticateWithOAuthDeps = Pick<
  OAuthModuleConfig,
  "accountRepo" | "oauthStore" | "receiptSigner" | "idGenerator" | "logger"
> & { readonly tokenLifespanMinutes: number };

export type LinkOAuthToAccountDeps = Pick<
  OAuthModuleConfig,
  "accountRepo" | "oauthStore" | "idGenerator" | "logger"
>;

export type UnlinkOAuthProviderDeps = Pick<OAuthModuleConfig, "oauthStore">;
