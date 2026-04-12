import type { AccountId } from "../shared/index.js";

/**
 * The set of authentication methods an account may have active.
 * @public
 */
export type AuthMethod = "password" | "oauth";

/**
 * Contract that every pluggable auth module must expose to the kernel.
 *
 * The kernel uses `exists()` to determine whether a method is active, and
 * `count()` to determine how many individual credentials exist for that method
 * (relevant for multi-credential methods like oauth where an account may have
 * several providers).
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
}
