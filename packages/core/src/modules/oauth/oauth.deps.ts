import type { AccountRepository } from "../../kernel/ports/account-repository.port.js";
import type { ReceiptSigner } from "../../kernel/ports/receipt-signer.port.js";
import type {
  IdGeneratorPort,
  LoggerPort,
} from "../../kernel/ports/shared-ports.port.js";
import type { OAuthCredentialStore } from "./ports/oauth-credential-store.port.js";

export interface OAuthModuleDeps {
  readonly accountRepo: AccountRepository;
  readonly oauthStore: OAuthCredentialStore;
  readonly receiptSigner: ReceiptSigner;
  readonly idGenerator: IdGeneratorPort;
  readonly logger: LoggerPort;
}

export type AuthenticateWithOAuthDeps = Pick<
  OAuthModuleDeps,
  "accountRepo" | "oauthStore" | "receiptSigner" | "idGenerator" | "logger"
> & { readonly tokenLifespanMinutes: number };

export type LinkOAuthToAccountDeps = Pick<
  OAuthModuleDeps,
  "accountRepo" | "oauthStore" | "idGenerator" | "logger"
>;

export type UnlinkOAuthProviderDeps = Pick<OAuthModuleDeps, "oauthStore">;
