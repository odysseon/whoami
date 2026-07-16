import type { AccountRepository } from "../../kernel/ports/account-repository.port.js";
import type {
  IdGeneratorPort,
  LoggerPort,
  ClockPort,
  SecureTokenPort,
} from "../../kernel/ports/shared-ports.port.js";
import type { PasswordHashStore } from "./ports/password-hash-store.port.js";
import type { PasswordResetTokenStore } from "./ports/password-reset-token-store.port.js";
import type { PasswordHasher } from "./ports/password-hasher.port.js";
import type { ReceiptSigner } from "../../kernel/ports/receipt-signer.port.js";
import { IssueReceiptUseCase } from "../../kernel/shared/issue-receipt.use-case.js";

export interface PasswordModuleDeps {
  readonly accountRepo: AccountRepository;
  readonly passwordHashStore: PasswordHashStore;
  readonly resetTokenStore: PasswordResetTokenStore;
  readonly passwordHasher: PasswordHasher;
  readonly receiptSigner: ReceiptSigner;
  readonly idGenerator: IdGeneratorPort;
  readonly logger: LoggerPort;
  readonly clock: ClockPort;
  readonly secureToken: SecureTokenPort;
}

export interface PasswordResetConfig {
  readonly tokenLifespanMinutes: number;
}

export interface VerifyPasswordResetConfig {
  readonly receiptLifespanMinutes: number;
}

export type RegisterWithPasswordDeps = Pick<
  PasswordModuleDeps,
  | "accountRepo"
  | "passwordHashStore"
  | "passwordHasher"
  | "idGenerator"
  | "logger"
>;

export type AuthenticateWithPasswordDeps = Pick<
  PasswordModuleDeps,
  "accountRepo" | "passwordHashStore" | "passwordHasher" | "logger"
> & { readonly issueReceipt: IssueReceiptUseCase };

export type ChangePasswordDeps = Pick<
  PasswordModuleDeps,
  "accountRepo" | "passwordHashStore" | "passwordHasher" | "logger"
>;

export type AddPasswordToAccountDeps = Pick<
  PasswordModuleDeps,
  | "accountRepo"
  | "passwordHashStore"
  | "passwordHasher"
  | "idGenerator"
  | "logger"
>;

export type RequestPasswordResetDeps = Pick<
  PasswordModuleDeps,
  | "accountRepo"
  | "resetTokenStore"
  | "idGenerator"
  | "logger"
  | "clock"
  | "secureToken"
> & { readonly config: PasswordResetConfig };

export type VerifyPasswordResetDeps = Pick<
  PasswordModuleDeps,
  "resetTokenStore" | "receiptSigner" | "secureToken"
> & { readonly config: VerifyPasswordResetConfig };

export type RevokeAllPasswordResetsDeps = Pick<
  PasswordModuleDeps,
  "resetTokenStore"
>;
