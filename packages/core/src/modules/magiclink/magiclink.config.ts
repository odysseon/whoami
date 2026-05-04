import type { AccountRepository } from "../../kernel/ports/account-repository.port.js";
import type { ReceiptSigner } from "../../kernel/ports/receipt-signer.port.js";
import type {
  IdGeneratorPort,
  LoggerPort,
  ClockPort,
  SecureTokenPort,
} from "../../kernel/ports/shared-ports.port.js";
import type { MagicLinkTokenStore } from "./ports/magiclink-token-store.port.js";
import type { ReceiptDTO } from "../../kernel/index.js";

/** Configuration for the MagicLink module */
export interface MagicLinkModuleConfig {
  readonly accountRepo: AccountRepository;
  readonly magicLinkStore: MagicLinkTokenStore;
  readonly receiptSigner: ReceiptSigner;
  readonly idGenerator: IdGeneratorPort;
  readonly logger: LoggerPort;
  readonly clock: ClockPort;
  readonly secureToken: SecureTokenPort;
  readonly tokenLifespanMinutes?: number;
  readonly receiptLifespanMinutes?: number;
}

/** Methods exposed by the MagicLink module */
export interface MagicLinkMethods {
  readonly requestMagicLink: (input: { email: string }) => Promise<{
    challengeId: string;
    plainTextToken: string;
    expiresAt: Date;
    isNewAccount: boolean;
  }>;

  readonly authenticateWithMagicLink: (input: { token: string }) => Promise<{
    receipt: ReceiptDTO;
    accountId: string;
    email: string;
  }>;
}

// ─── DERIVED I/O TYPES ───

export type RequestMagicLinkInput = Parameters<
  MagicLinkMethods["requestMagicLink"]
>[0];
export type RequestMagicLinkOutput = Awaited<
  ReturnType<MagicLinkMethods["requestMagicLink"]>
>;

export type AuthenticateWithMagicLinkInput = Parameters<
  MagicLinkMethods["authenticateWithMagicLink"]
>[0];
export type AuthenticateWithMagicLinkOutput = Awaited<
  ReturnType<MagicLinkMethods["authenticateWithMagicLink"]>
>;

// ─── DERIVED DEPS TYPES ───

export type RequestMagicLinkDeps = Pick<
  MagicLinkModuleConfig,
  | "accountRepo"
  | "magicLinkStore"
  | "idGenerator"
  | "logger"
  | "clock"
  | "secureToken"
> & { readonly config: MagicLinkConfig };

export type AuthenticateWithMagicLinkDeps = Pick<
  MagicLinkModuleConfig,
  "magicLinkStore" | "receiptSigner" | "secureToken"
> & { readonly config: MagicLinkConfig };

// ─── INTERNAL CONFIG TYPE ───

export interface MagicLinkConfig {
  readonly tokenLifespanMinutes: number;
  readonly receiptLifespanMinutes: number;
}
