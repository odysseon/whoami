import type { AccountRepository } from "../kernel/account/account.repository.port.js";
import type { ReceiptSigner } from "../kernel/receipt/ports/receipt-signer.port.js";
import type { ReceiptVerifier } from "../kernel/receipt/ports/receipt-verifier.port.js";
import type { LoggerPort } from "../kernel/shared/ports/logger.port.js";
import type { IdGeneratorPort } from "../kernel/shared/ports/id-generator.port.js";
import type { ClockPort } from "../kernel/shared/ports/clock.port.js";
import type { AuthMethod } from "../kernel/auth/auth-method.port.js";
import type {
  PasswordConfig,
  PasswordMethods,
} from "../modules/password/index.js";
import type { OAuthConfig, OAuthMethods } from "../modules/oauth/index.js";

// ── Utilities ─────────────────────────────────────────────────────────────────

type RequireAtLeastOne<T> = {
  [K in keyof T]: Required<Pick<T, K>> & Partial<Omit<T, K>>;
}[keyof T];

type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

// ── Core methods always present ───────────────────────────────────────────────

export interface CoreAuthMethods {
  getAccountAuthMethods(
    accountId: import("../kernel/shared/index.js").AccountId,
  ): Promise<AuthMethod[]>;
  removeAuthMethod(
    accountId: import("../kernel/shared/index.js").AccountId,
    method: AuthMethod,
    options?: { provider?: string },
  ): Promise<void>;
}

// ── Registry: single source of truth ─────────────────────────────────────────
//
// To add a new auth method:
//   1. Add one entry here.
//   2. Create modules/<key>/index.ts implementing AuthModule.
//   3. Append to MODULES in create-auth.ts.

interface AuthMethodRegistry {
  password: { config: PasswordConfig; methods: PasswordMethods };
  oauth: { config: OAuthConfig; methods: OAuthMethods };
}

export type AuthMethodKey = keyof AuthMethodRegistry;

type AllAuthConfigs = { [K in AuthMethodKey]: AuthMethodRegistry[K]["config"] };

// ── Main config type ──────────────────────────────────────────────────────────

export type AuthConfig = {
  accountRepo: AccountRepository;
  receiptSigner: ReceiptSigner;
  receiptVerifier: ReceiptVerifier;
  logger: LoggerPort;
  idGenerator: IdGeneratorPort;
  clock?: ClockPort;
  tokenLifespanMinutes?: number;
} & RequireAtLeastOne<AllAuthConfigs>;

// ── Return type ───────────────────────────────────────────────────────────────

type MethodsForConfig<T> = UnionToIntersection<
  {
    [K in keyof T]: K extends AuthMethodKey
      ? AuthMethodRegistry[K]["methods"]
      : never;
  }[keyof T]
>;

export type AuthMethods<T extends AuthConfig = AuthConfig> = CoreAuthMethods &
  MethodsForConfig<T>;

/**
 * A concrete, non-generic alias for `AuthMethods` that includes all known
 * module methods as optional properties.
 *
 * Use this type when you need to annotate a variable, parameter, or DI token
 * that holds an `AuthMethods` facade but you don't have the specific `T`
 * available — for example in adapters, guards, or example apps.
 *
 * Individual methods are optional because not every consumer configures every
 * module. At runtime the guard pattern (`if (!auth.authenticateWithOAuth)`)
 * remains correct.
 *
 * @public
 */
export type AnyAuthMethods = CoreAuthMethods &
  Partial<PasswordMethods> &
  Partial<OAuthMethods>;

// ── Type guard ────────────────────────────────────────────────────────────────

export function hasAuthMethod<K extends AuthMethodKey>(
  config: AuthConfig,
  method: K,
): config is AuthConfig & Record<K, AuthMethodRegistry[K]["config"]> {
  return (
    method in config && config[method as keyof typeof config] !== undefined
  );
}
