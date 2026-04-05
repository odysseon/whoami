import { AccountRepository } from "./features/accounts/index.js";
import { AuthenticateOAuthInput } from "./features/authentication/authenticate-oauth.usecase.js";
import {
  LinkOAuthToAccountInput,
  OAuthCredentialStore,
  PasswordCredentialStore,
  PasswordManager,
} from "./features/credentials/index.js";
import {
  IssueReceiptUseCase,
  Receipt,
  VerifyReceiptUseCase,
} from "./features/receipts/index.js";
import { AccountId, LoggerPort } from "./shared/index.js";

export interface AuthConfig {
  accountRepo: AccountRepository;
  tokenSigner: IssueReceiptUseCase;
  verifyReceipt: VerifyReceiptUseCase;
  logger: LoggerPort;
  generateId: () => string | number;

  password?: {
    hashManager: PasswordManager;
    passwordStore: PasswordCredentialStore;
  };

  oauth?: {
    oauthStore: OAuthCredentialStore;
  };
}

export interface AuthMethods {
  registerWithPassword?: (input: RegisterArgs) => Promise<Receipt>;
  authenticateWithPassword?: (input: LoginArgs) => Promise<Receipt>;

  authenticateWithOAuth?: (input: AuthenticateOAuthInput) => Promise<Receipt>;
  linkOAuthToAccount?: (input: LinkOAuthToAccountInput) => Promise<void>;

  getAccountAuthMethods: (accountId: AccountId) => Promise<AuthMethod[]>;

  addPasswordToAccount?: (
    accountId: AccountId,
    password: string,
  ) => Promise<void>;

  addOAuthToAccount?: (
    accountId: AccountId,
    provider: string,
    providerId: string,
  ) => Promise<void>;

  removeAuthMethod: (
    accountId: AccountId,
    method: AuthMethod,
    options?: { provider?: string },
  ) => Promise<void>;
}

type RegisterArgs = {
  email: string;
  password: string;
};

type LoginArgs = {
  email: string;
  password: string;
};

export type AuthMethod = "password" | "oauth";
