import type { ReceiptDTO } from "../../kernel/index.js";

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
