import { AccountId, EmailAddress } from "../shared/index.js";
import { Account } from "./account.entity.js";

/**
 * Storage contract for accounts.
 * Implement in your infrastructure layer with any backend.
 * @public
 */
export interface AccountRepository {
  save(account: Account): Promise<void>;
  findById(id: AccountId): Promise<Account | null>;
  findByEmail(email: EmailAddress): Promise<Account | null>;
  /**
   * Permanently removes an account. Used as a compensating action when a
   * credential write fails after account creation.
   * Implementations must treat a missing ID as a no-op (idempotent).
   */
  delete(id: AccountId): Promise<void>;
}
