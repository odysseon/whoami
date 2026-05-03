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

/**
 * Configuration for the password module.
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

/**
 * Methods exposed by the password module — THE SINGLE SOURCE OF TRUTH.
 * All use-case I/O types are derived from this interface.
 */
export interface PasswordMethods {
  readonly registerWithPassword: (input: {
    email: string;
    password: string;
  }) => Promise<{ account: Account }>;

  readonly authenticateWithPassword: (input: {
    email: string;
    password: string;
  }) => Promise<{
    receipt: Receipt;
    account: Account;
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

/** Input for registering with password */
export type RegisterWithPasswordInput = Parameters<
  PasswordMethods["registerWithPassword"]
>[0];

/** Output from registering with password */
export type RegisterWithPasswordOutput = Awaited<
  ReturnType<PasswordMethods["registerWithPassword"]>
>;

/** Input for authenticating with password */
export type AuthenticateWithPasswordInput = Parameters<
  PasswordMethods["authenticateWithPassword"]
>[0];

/** Output from authenticating with password */
export type AuthenticateWithPasswordOutput = Awaited<
  ReturnType<PasswordMethods["authenticateWithPassword"]>
>;

/** Input for changing password */
export type ChangePasswordInput = Parameters<
  PasswordMethods["changePassword"]
>[0];

/** Output from changing password */
export type ChangePasswordOutput = Awaited<
  ReturnType<PasswordMethods["changePassword"]>
>;

/** Input for adding password to account */
export type AddPasswordToAccountInput = Parameters<
  PasswordMethods["addPasswordToAccount"]
>[0];

/** Output from adding password to account */
export type AddPasswordToAccountOutput = Awaited<
  ReturnType<PasswordMethods["addPasswordToAccount"]>
>;

/** Input for requesting password reset */
export type RequestPasswordResetInput = Parameters<
  PasswordMethods["requestPasswordReset"]
>[0];

/** Output from requesting password reset */
export type RequestPasswordResetOutput = NonNullable<
  Awaited<ReturnType<PasswordMethods["requestPasswordReset"]>>
>;

/** Configuration for password reset token lifespan */
export interface PasswordResetConfig {
  readonly tokenLifespanMinutes: number;
}

/** Input for verifying password reset */
export type VerifyPasswordResetInput = Parameters<
  PasswordMethods["verifyPasswordReset"]
>[0];

/** Output from verifying password reset */
export type VerifyPasswordResetOutput = Awaited<
  ReturnType<PasswordMethods["verifyPasswordReset"]>
>;

/** Configuration for receipt lifespan after reset verification */
export interface VerifyPasswordResetConfig {
  readonly receiptLifespanMinutes: number;
}

/** Input for revoking all password resets */
export type RevokeAllPasswordResetsInput = Parameters<
  PasswordMethods["revokeAllPasswordResets"]
>[0];

/** Output from revoking all password resets */
export type RevokeAllPasswordResetsOutput = Awaited<
  ReturnType<PasswordMethods["revokeAllPasswordResets"]>
>;
