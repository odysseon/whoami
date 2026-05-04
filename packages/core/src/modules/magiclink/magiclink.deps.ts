import type { AccountRepository } from "../../kernel/ports/account-repository.port.js";
import type { ReceiptSigner } from "../../kernel/ports/receipt-signer.port.js";
import type {
  IdGeneratorPort,
  LoggerPort,
  ClockPort,
  SecureTokenPort,
} from "../../kernel/ports/shared-ports.port.js";
import type { MagicLinkTokenStore } from "./ports/magiclink-token-store.port.js";

export interface MagicLinkModuleDeps {
  readonly accountRepo: AccountRepository;
  readonly magicLinkStore: MagicLinkTokenStore;
  readonly receiptSigner: ReceiptSigner;
  readonly idGenerator: IdGeneratorPort;
  readonly logger: LoggerPort;
  readonly clock: ClockPort;
  readonly secureToken: SecureTokenPort;
}

export interface MagicLinkConfig {
  readonly tokenLifespanMinutes: number;
  readonly receiptLifespanMinutes: number;
}

export type RequestMagicLinkDeps = Pick<
  MagicLinkModuleDeps,
  | "accountRepo"
  | "magicLinkStore"
  | "idGenerator"
  | "logger"
  | "clock"
  | "secureToken"
> & { readonly config: MagicLinkConfig };

export type AuthenticateWithMagicLinkDeps = Pick<
  MagicLinkModuleDeps,
  "magicLinkStore" | "receiptSigner" | "secureToken"
> & { readonly config: MagicLinkConfig };
