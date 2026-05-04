import type { AccountDTO, ReceiptDTO } from "../../kernel/index.js";

export interface PasswordMethods {
  readonly registerWithPassword: (input: {
    email: string;
    password: string;
  }) => Promise<{ account: AccountDTO }>;

  readonly authenticateWithPassword: (input: {
    email: string;
    password: string;
  }) => Promise<{ receipt: ReceiptDTO; account: AccountDTO }>;

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
  }) => Promise<{ receipt: ReceiptDTO; accountId: string }>;

  readonly revokeAllPasswordResets: (input: {
    accountId: string;
  }) => Promise<{ success: true }>;
}
