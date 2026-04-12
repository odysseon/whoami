import type { AccountId } from "../shared/index.js";

/**
 * The set of authentication methods an account may have active.
 * @public
 */
export type AuthMethod = "password" | "oauth";

/**
 * Contract that every pluggable auth module must expose to the kernel.
 *
 * The kernel calls `exists()` to determine whether a module has a live
 * credential for an account — without knowing anything about the module's
 * internal storage.
 * @public
 */
export interface AuthMethodPort {
  readonly method: AuthMethod;
  exists(accountId: AccountId): Promise<boolean>;
}
