import type { AccountRepository } from "./features/accounts/index.js";
import type { AuthenticateOAuthInput } from "./features/authentication/application/authenticate-oauth.usecase.js";
import type { AuthenticateWithPasswordInput } from "./features/authentication/index.js";
import type {
  LinkOAuthToAccountInput,
  OAuthCredentialStore,
  PasswordCredentialStore,
  PasswordManager,
  RegisterWithPasswordInput,
  UpdatePasswordInput,
} from "./features/credentials/index.js";
import type { AddPasswordAuthInput } from "./features/authentication/application/add-password-auth.usecase.js";
import type { Receipt } from "./features/receipts/index.js";
import type {
  ReceiptSigner,
  ReceiptVerifier,
} from "./features/receipts/index.js";
import type { AccountId, LoggerPort } from "./shared/index.js";
import type { AuthMethod, AuthMethodsProvider } from "./shared/index.js";

// Re-export so consumers can import from the types barrel
export type { AuthMethod, AuthMethodsProvider };

// ── Utilities ────────────────────────────────────────────────────────────────

/**
 * Requires at least one property from T to be present.
 */
type RequireAtLeastOne<T> = {
  [K in keyof T]: Required<Pick<T, K>> & Partial<Omit<T, K>>;
}[keyof T];

/**
 * Converts a union of object types into a single intersection type.
 */
type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

// ── Feature-specific config types ────────────────────────────────────────────

export interface PasswordAuthConfig {
  passwordManager: PasswordManager;
  passwordStore: PasswordCredentialStore;
}

export interface OAuthConfig {
  oauthStore: OAuthCredentialStore;
}

// ── Method interfaces ─────────────────────────────────────────────────────────

export interface PasswordAuthMethods {
  registerWithPassword(input: RegisterWithPasswordInput): Promise<Receipt>;
  authenticateWithPassword(
    input: AuthenticateWithPasswordInput,
  ): Promise<Receipt>;
  /**
   * Adds a password credential to an account that authenticated via OAuth.
   * Input carries both `accountId` and `password` as named fields.
   */
  addPasswordToAccount(input: AddPasswordAuthInput): Promise<void>;
  updatePassword(input: UpdatePasswordInput): Promise<void>;
}

export interface OAuthAuthMethods {
  authenticateWithOAuth(input: AuthenticateOAuthInput): Promise<Receipt>;
  linkOAuthToAccount(input: LinkOAuthToAccountInput): Promise<void>;
}

export interface CoreAuthMethods {
  getAccountAuthMethods: AuthMethodsProvider;
  removeAuthMethod(
    accountId: AccountId,
    method: AuthMethod,
    options?: { provider?: string },
  ): Promise<void>;
}

// ── Registry: Single Source of Truth ─────────────────────────────────────────
//
// To add a new authentication method:
//   1. Add one entry here — config type + methods type.
//   2. Create src/modules/<key>/index.ts implementing AuthModule<TConfig, TMethods>.
//   3. Add the module to the MODULES array in whoami.ts.
//
// Everything below this line is automatically derived from the registry.

interface AuthMethodRegistry {
  password: {
    config: PasswordAuthConfig;
    methods: PasswordAuthMethods;
  };
  oauth: {
    config: OAuthConfig;
    methods: OAuthAuthMethods;
  };
}

// ── Derived types (do not edit manually) ─────────────────────────────────────

/** All registered authentication method keys. */
export type AuthMethodKey = keyof AuthMethodRegistry;

/** Maps each auth method key to its config type. */
type AllAuthConfigs = {
  [K in AuthMethodKey]: AuthMethodRegistry[K]["config"];
};

// ── Main Config Type ──────────────────────────────────────────────────────────

/**
 * Configuration for {@link createAuth}.
 *
 * At least one authentication method must be configured.
 *
 * @example
 * // Password only
 * const auth = createAuth({
 *   accountRepo, receiptSigner, receiptVerifier, logger, generateId,
 *   password: { passwordManager, passwordStore },
 * });
 *
 * @example
 * // Both password and OAuth
 * const auth = createAuth({
 *   accountRepo, receiptSigner, receiptVerifier, logger, generateId,
 *   password: { passwordManager, passwordStore },
 *   oauth: { oauthStore },
 * });
 */
export type AuthConfig = {
  accountRepo: AccountRepository;
  receiptSigner: ReceiptSigner;
  receiptVerifier: ReceiptVerifier;
  tokenLifespanMinutes?: number;
  logger: LoggerPort;
  generateId: () => string;
} & RequireAtLeastOne<AllAuthConfigs>;

// ── Return Type ───────────────────────────────────────────────────────────────

type MethodsForConfig<T> = UnionToIntersection<
  {
    [K in keyof T]: K extends AuthMethodKey
      ? AuthMethodRegistry[K]["methods"]
      : never;
  }[keyof T]
>;

/**
 * Final exposed API type — core methods plus the methods for every auth
 * type present in the config.
 */
export type AuthMethods<T extends AuthConfig = AuthConfig> = CoreAuthMethods &
  MethodsForConfig<T>;

// ── Type Guard ────────────────────────────────────────────────────────────────

/**
 * Narrows `config` to confirm that a specific authentication method is
 * configured and its config object is present.
 */
export function hasAuthMethod<K extends AuthMethodKey>(
  config: AuthConfig,
  method: K,
): config is AuthConfig & Record<K, AuthMethodRegistry[K]["config"]> {
  return (
    method in config && config[method as keyof typeof config] !== undefined
  );
}
