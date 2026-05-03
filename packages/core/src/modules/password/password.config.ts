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
import type { Account, Receipt } from "../../kernel/domain/entities/index.js";

// ─── UNIFIED DEPENDENCIES ───

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

// ─── MODULE CONFIG ───

export interface PasswordModuleConfig extends PasswordModuleDeps {
  readonly tokenLifespanMinutes?: number;
  readonly resetTokenLifespanMinutes?: number;
}

// ─── DERIVED DTO TYPE ───

/** Public account shape — no branded types, no string dates */
export type AccountDTO = ReturnType<Account["toDTO"]>;

// ─── PUBLIC METHODS — Single source of truth ───

export interface PasswordMethods {
  readonly registerWithPassword: (input: {
    email: string;
    password: string;
  }) => Promise<{ account: AccountDTO }>;

  readonly authenticateWithPassword: (input: {
    email: string;
    password: string;
  }) => Promise<{
    receipt: Receipt;
    account: AccountDTO;
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

  readonly requestPasswordReset: (input: { email: string }) => Promise<{
    challengeId: string;
    plainTextToken: string;
    expiresAt: Date;
  } | null>;

  readonly verifyPasswordReset: (input: {
    token: string;
  }) => Promise<{ receipt: Receipt; accountId: string }>;

  readonly revokeAllPasswordResets: (input: {
    accountId: string;
  }) => Promise<{ success: true }>;
}

// ─── DERIVED I/O TYPES ───

export type RegisterWithPasswordInput = Parameters<
  PasswordMethods["registerWithPassword"]
>[0];
export type RegisterWithPasswordOutput = Awaited<
  ReturnType<PasswordMethods["registerWithPassword"]>
>;

export type AuthenticateWithPasswordInput = Parameters<
  PasswordMethods["authenticateWithPassword"]
>[0];
export type AuthenticateWithPasswordOutput = Awaited<
  ReturnType<PasswordMethods["authenticateWithPassword"]>
>;

export type ChangePasswordInput = Parameters<
  PasswordMethods["changePassword"]
>[0];
export type ChangePasswordOutput = Awaited<
  ReturnType<PasswordMethods["changePassword"]>
>;

export type AddPasswordToAccountInput = Parameters<
  PasswordMethods["addPasswordToAccount"]
>[0];
export type AddPasswordToAccountOutput = Awaited<
  ReturnType<PasswordMethods["addPasswordToAccount"]>
>;

export type RequestPasswordResetInput = Parameters<
  PasswordMethods["requestPasswordReset"]
>[0];
export type RequestPasswordResetOutput = NonNullable<
  Awaited<ReturnType<PasswordMethods["requestPasswordReset"]>>
>;

export type VerifyPasswordResetInput = Parameters<
  PasswordMethods["verifyPasswordReset"]
>[0];
export type VerifyPasswordResetOutput = Awaited<
  ReturnType<PasswordMethods["verifyPasswordReset"]>
>;

export type RevokeAllPasswordResetsInput = Parameters<
  PasswordMethods["revokeAllPasswordResets"]
>[0];
export type RevokeAllPasswordResetsOutput = Awaited<
  ReturnType<PasswordMethods["revokeAllPasswordResets"]>
>;

// ─── DERIVED DEPS TYPES ───

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
  | "accountRepo"
  | "passwordHashStore"
  | "passwordHasher"
  | "receiptSigner"
  | "logger"
> & { readonly tokenLifespanMinutes: number };

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

// ─── INTERNAL CONFIG TYPES ───

export interface PasswordResetConfig {
  readonly tokenLifespanMinutes: number;
}

export interface VerifyPasswordResetConfig {
  readonly receiptLifespanMinutes: number;
}
