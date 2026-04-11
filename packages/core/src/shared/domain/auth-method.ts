import type { AccountId } from "./value-objects/account-id.vo.js";

/**
 * The set of authentication methods that an account may have active.
 * @public
 */
export type AuthMethod = "password" | "oauth";

/**
 * Returns the currently active authentication methods for an account.
 *
 * Implementations query whatever stores are configured and return only the
 * methods that have a live credential for the given account.
 *
 * @public
 */
export type AuthMethodsProvider = (
  accountId: AccountId,
) => Promise<AuthMethod[]>;
