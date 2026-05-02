import type { AccountRepository } from "../../kernel/ports/account-repository.port.js";
import type { ReceiptSigner } from "../../kernel/ports/receipt-signer.port.js";
import type {
  IdGeneratorPort,
  LoggerPort,
  ClockPort,
  SecureTokenPort,
} from "../../kernel/ports/shared-ports.port.js";
import type { MagicLinkTokenStore } from "./ports/magiclink-token-store.port.js";
import type { RequestMagicLinkOutput } from "./use-cases/index.js";

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
  readonly requestMagicLink: (input: {
    email: string;
  }) => Promise<RequestMagicLinkOutput>;

  readonly authenticateWithMagicLink: (input: { token: string }) => Promise<{
    receipt: { token: string; accountId: string; expiresAt: Date };
    accountId: string;
    email: string;
  }>;
}
