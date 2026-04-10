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

/**
 * The set of authentication methods that an account may have active.
 * @public
 */
export type AuthMethod = "password" | "oauth";

/** @internal */
type RegisterArgs = { email: string; password: string };

/** @internal */
type LoginArgs = { email: string; password: string };

/**
 * Top-level configuration passed to {@link createAuth}.
 *
 * Configure only the sections that match the authentication flows your
 * application supports.  Omitting `password` or `oauth` disables the
 * corresponding methods at runtime.
 *
 * @public
 */
export interface AuthConfig {
  /** Persistence port for account aggregates. */
  accountRepo: AccountRepository;
  /** Configured {@link IssueReceiptUseCase} — mints signed receipts after auth. */
  tokenSigner: IssueReceiptUseCase;
  /** Configured {@link VerifyReceiptUseCase} — validates receipt tokens. */
  verifyReceipt: VerifyReceiptUseCase;
  /** Structured logger injected into every use-case. */
  logger: LoggerPort;
  /**
   * Deterministic ID generator for account and credential IDs.
   * Must return a unique non-empty string on every call.
   * Recommended: `crypto.randomUUID` (built-in since Node 14.17).
   */
  generateId: () => string;

  /** Password-auth section — omit to disable password-based flows. */
  password?: {
    /** Password hashing and comparison port. */
    hashManager: PasswordManager;
    /** Persistence port for password credentials. */
    passwordStore: PasswordCredentialStore;
  };

  /** OAuth section — omit to disable OAuth-based flows. */
  oauth?: {
    /** Persistence port for OAuth credentials. */
    oauthStore: OAuthCredentialStore;
  };
}

/**
 * The authenticated API surface returned by {@link createAuth}.
 *
 * Methods are optional — they are only present when the corresponding section
 * is configured in {@link AuthConfig}.
 *
 * @public
 */
export interface AuthMethods {
  /**
   * Registers a new account with a password credential and returns a receipt.
   * Present only when `config.password` is configured.
   */
  registerWithPassword?: (input: RegisterArgs) => Promise<Receipt>;

  /**
   * Authenticates a user with email + password and returns a receipt.
   * Present only when `config.password` is configured.
   */
  authenticateWithPassword?: (input: LoginArgs) => Promise<Receipt>;

  /**
   * Authenticates (or auto-registers) a user via OAuth and returns a receipt.
   * Present only when `config.oauth` is configured.
   */
  authenticateWithOAuth?: (input: AuthenticateOAuthInput) => Promise<Receipt>;

  /**
   * Links an OAuth credential to an authenticated account.
   * Present only when `config.oauth` is configured.
   */
  linkOAuthToAccount?: (input: LinkOAuthToAccountInput) => Promise<void>;

  /**
   * Returns the currently active authentication methods for an account.
   * Always present.
   */
  getAccountAuthMethods: (accountId: AccountId) => Promise<AuthMethod[]>;

  /**
   * Adds a password credential to an existing account.
   * Present only when `config.password` is configured.
   */
  addPasswordToAccount?: (
    accountId: AccountId,
    password: string,
  ) => Promise<void>;

  /**
   * Removes an authentication method from an account.
   *
   * Throws {@link CannotRemoveLastCredentialError} when the removal would leave
   * the account with no remaining authentication methods.
   *
   * @param accountId - The account to modify.
   * @param method    - The auth method to remove.
   * @param options   - For `"oauth"`, optionally specify a `provider` to remove
   *                    only that provider rather than all OAuth credentials.
   */
  removeAuthMethod: (
    accountId: AccountId,
    method: AuthMethod,
    options?: { provider?: string },
  ) => Promise<void>;

  /**
   * Updates the account's password.
   * Present only when `config.password` is configured.
   *
   * @param input - Contains receipt token, current password, and new password.
   * @throws {AuthenticationError} If current password is incorrect or no password credential exists.
   */
  updatePassword?: (input: {
    receiptToken: string;
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
}
