import type { AccountDTO, ReceiptDTO } from "../../kernel/index.js";

export interface OAuthMethods {
  readonly authenticateWithOAuth: (input: {
    provider: string;
    providerId: string;
    email: string;
  }) => Promise<{
    receipt: ReceiptDTO;
    account: AccountDTO;
    isNewAccount: boolean;
  }>;

  readonly linkOAuthToAccount: (input: {
    accountId: string;
    provider: string;
    providerId: string;
  }) => Promise<{ success: true }>;

  readonly unlinkProvider: (
    accountId: string,
    provider: string,
  ) => Promise<void>;
}
