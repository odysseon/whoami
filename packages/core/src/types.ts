import type { AccountRepository } from "./features/accounts/index.js";
import type { AuthenticateOAuthInput } from "./features/authentication/application/authenticate-oauth.usecase.js";
import type {
  LinkOAuthToAccountInput,
  OAuthCredentialStore,
  PasswordCredentialStore,
  PasswordManager,
} from "./features/credentials/index.js";
import type { Receipt } from "./features/receipts/index.js";
import type {
  ReceiptSigner,
  ReceiptVerifier,
} from "./features/receipts/index.js";
import type { AccountId, LoggerPort } from "./shared/index.js";
import type { AuthMethod, AuthMethodsProvider } from "./shared/index.js";

// Re-export so consumers can import from the types barrel
export type { AuthMethod, AuthMethodsProvider };

// ── Internal arg shapes ──────────────────────────────────────────────────────

/** @internal */
type RegisterArgs = { email: string; password: string };

/** @internal */
type LoginArgs = { email: string; password: string };

/** @internal */
type UpdatePasswordArgs = {
  receiptToken: string;
  currentPassword: string;
  newPassword: string;
};

// ── Config ───────────────────────────────────────────────────────────────────

/**
 * Password-auth section of {@link AuthConfig}.
 * @public
 */
export interface PasswordAuthConfig {
  /** Password hashing and comparison port. */
  passwordManager: PasswordManager;
  /** Persistence port for password credentials. */
  passwordStore: PasswordCredentialStore;
}

/**
 * OAuth section of {@link AuthConfig}.
 * @public
 */
export interface OAuthConfig {
  /** Persistence port for OAuth credentials. */
  oauthStore: OAuthCredentialStore;
}

/**
 * Top-level configuration passed to {@link createAuth}.
 *
 * Configure only the sections that match the authentication flows your
 * application supports. Omitting `password` or `oauth` disables the
 * corresponding methods at compile time and at runtime.
 *
 * @public
 */
export interface AuthConfig {
  /** Persistence port for account aggregates. */
  accountRepo: AccountRepository;
  /**
   * Receipt signer port — produces signed tokens after successful authentication.
   */
  receiptSigner: ReceiptSigner;
  /**
   * Receipt verifier port — validates signed tokens on protected routes.
   * Must be the counterpart of {@link receiptSigner}.
   */
  receiptVerifier: ReceiptVerifier;
  /**
   * How long issued receipts remain valid, in minutes.
   * Must be a positive integer. Defaults to `60`.
   */
  tokenLifespanMinutes?: number;
  /** Structured logger injected into every use-case. */
  logger: LoggerPort;
  /**
   * Deterministic ID generator for account and credential IDs.
   * Must return a unique non-empty string on every call.
   * Recommended: `crypto.randomUUID` (built-in since Node 14.17).
   */
  generateId: () => string;
  /** Password-auth section — omit to disable password-based flows. */
  password?: PasswordAuthConfig;
  /** OAuth section — omit to disable OAuth-based flows. */
  oauth?: OAuthConfig;
}

// ── Facade capability interfaces ─────────────────────────────────────────────

/**
 * Password-auth methods present when `config.password` is configured.
 * @public
 */
export interface PasswordAuthMethods {
  /** Registers a new account with a password credential and returns a receipt. */
  registerWithPassword(input: RegisterArgs): Promise<Receipt>;
  /** Authenticates a user with email + password and returns a receipt. */
  authenticateWithPassword(input: LoginArgs): Promise<Receipt>;
  /** Adds a password credential to an existing account. */
  addPasswordToAccount(accountId: AccountId, password: string): Promise<void>;
  /** Updates the account's password after verifying the current one. */
  updatePassword(input: UpdatePasswordArgs): Promise<void>;
}

/**
 * OAuth methods present when `config.oauth` is configured.
 * @public
 */
export interface OAuthAuthMethods {
  /** Authenticates (or auto-registers) a user via OAuth and returns a receipt. */
  authenticateWithOAuth(input: AuthenticateOAuthInput): Promise<Receipt>;
  /** Links an OAuth credential to an authenticated account. */
  linkOAuthToAccount(input: LinkOAuthToAccountInput): Promise<void>;
}

/**
 * Methods always present regardless of configuration.
 * @public
 */
export interface CoreAuthMethods {
  /**
   * Returns the currently active authentication methods for an account.
   * Always present.
   */
  getAccountAuthMethods: AuthMethodsProvider;

  /**
   * Removes an authentication method from an account.
   *
   * Throws {@link CannotRemoveLastCredentialError} when removal would leave
   * the account with no remaining authentication methods.
   *
   * @param accountId - The account to modify.
   * @param method    - The auth method to remove.
   * @param options   - For `"oauth"`, optionally specify a `provider` to remove
   *                    only that provider rather than all OAuth credentials.
   */
  removeAuthMethod(
    accountId: AccountId,
    method: AuthMethod,
    options?: { provider?: string },
  ): Promise<void>;
}

/**
 * The full authenticated API surface returned by {@link createAuth}.
 *
 * Prefer the narrowed overload signatures of `createAuth` over this type when
 * you know which auth sections are configured — they eliminate optional
 * chaining at call sites.
 *
 * @public
 */
export type AuthMethods = CoreAuthMethods &
  Partial<PasswordAuthMethods> &
  Partial<OAuthAuthMethods>;

/**
 * Narrowed facade type when both password and OAuth are configured.
 * @public
 */
export type FullAuthMethods = CoreAuthMethods &
  PasswordAuthMethods &
  OAuthAuthMethods;

/**
 * Narrowed facade type when only password auth is configured.
 * @public
 */
export type PasswordOnlyAuthMethods = CoreAuthMethods & PasswordAuthMethods;

/**
 * Narrowed facade type when only OAuth is configured.
 * @public
 */
export type OAuthOnlyAuthMethods = CoreAuthMethods & OAuthAuthMethods;
