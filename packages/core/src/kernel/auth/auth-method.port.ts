import type { AccountId } from "../shared/index.js";

/**
 * The set of authentication methods an account may have active.
 * @public
 */
export type AuthMethod = "password" | "oauth";

/**
 * Contract that every pluggable auth module must expose to the kernel.
 *
 * The kernel uses `exists()` to determine whether a method is active, `count()`
 * to determine how many individual credentials exist for that method, and
 * `countAfterRemoval()` (when implemented) to get a provider-aware accurate
 * post-removal count before any deletion is attempted.
 *
 * Neither method may import module internals — all queries go through this port.
 * @public
 */
export interface AuthMethodPort {
  readonly method: AuthMethod;
  exists(accountId: AccountId): Promise<boolean>;
  /**
   * Returns the number of individual credentials for this method on the account.
   * For single-credential methods (password), this is 0 or 1.
   * For multi-credential methods (oauth), this is the provider count.
   */
  count(accountId: AccountId): Promise<number>;
  /**
   * Returns the number of credentials that would remain for this method after
   * the described removal, **without mutating state**.
   *
   * Implementing this is optional for single-credential methods. When omitted
   * the kernel falls back to `Math.max(0, count - 1)` for provider-scoped
   * removals and `0` for full-method removals.
   *
   * Multi-credential methods (oauth) **must** implement this so the kernel can
   * detect a non-linked provider before running the last-credential guard —
   * ensuring `OAuthProviderNotFoundError` takes precedence over
   * `CannotRemoveLastCredentialError`.
   *
   * @throws {OAuthProviderNotFoundError} (or equivalent) if `provider` is
   * defined but not linked to the account.
   */
  countAfterRemoval?(accountId: AccountId, provider?: string): Promise<number>;
}
