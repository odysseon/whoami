import type { AccountRepository } from "../../kernel/ports/account-repository.port.js";
import type { ReceiptSigner } from "../../kernel/ports/receipt-signer.port.js";
import type {
  IdGeneratorPort,
  LoggerPort,
  ClockPort,
  SecureTokenPort,
} from "../../kernel/ports/shared-ports.port.js";
import type { PasswordHashStore } from "./ports/password-hash-store.port.js";
import type { PasswordResetTokenStore } from "./ports/password-reset-token-store.port.js";
import type { PasswordHasher } from "./ports/password-hasher.port.js";
import type {
  RequestPasswordResetOutput,
  VerifyPasswordResetOutput,
} from "./use-cases/index.js";

/**
 * Configuration for the password module.
 *
 * Two stores are required because they have fundamentally different invariants:
 * - passwordHashStore: unique per account, permanent until changed
 * - resetTokenStore: many per account, short-lived, expirable
 */
export interface PasswordModuleConfig {
  readonly accountRepo: AccountRepository;
  readonly passwordHashStore: PasswordHashStore;
  readonly resetTokenStore: PasswordResetTokenStore;
  readonly passwordHasher: PasswordHasher;
  readonly receiptSigner: ReceiptSigner;
  readonly idGenerator: IdGeneratorPort;
  readonly logger: LoggerPort;
  readonly clock: ClockPort;
  readonly secureToken: SecureTokenPort;
  readonly tokenLifespanMinutes?: number;
  readonly resetTokenLifespanMinutes?: number;
}

/** Methods exposed by the password module */
export interface PasswordMethods {
  readonly registerWithPassword: (input: {
    email: string;
    password: string;
  }) => Promise<{ account: { id: string; email: string; createdAt: Date } }>;

  readonly authenticateWithPassword: (input: {
    email: string;
    password: string;
  }) => Promise<{
    receipt: { token: string; accountId: string; expiresAt: Date };
    account: { id: string; email: string; createdAt: Date };
  }>;

  readonly changePassword: (input: {
    accountId: string;
    currentPassword: string;
    newPassword: string;
  }) => Promise<{ success: true }>;

  readonly addPasswordToAccount: (input: {
    accountId: string;
    password: string;
  }) => Promise<{ success: true }>;

  readonly requestPasswordReset: (input: {
    email: string;
  }) => Promise<RequestPasswordResetOutput | null>;

  readonly verifyPasswordReset: (input: {
    token: string;
  }) => Promise<VerifyPasswordResetOutput>;

  readonly revokeAllPasswordResets: (input: {
    accountId: string;
  }) => Promise<{ success: true }>;
}
