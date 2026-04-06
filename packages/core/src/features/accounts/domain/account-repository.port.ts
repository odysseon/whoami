import {
  AccountId,
  EmailAddress,
} from "../../../shared/domain/value-objects/index.js";
import { Account } from "./account.entity.js";

/**
 * Persistence port for account aggregates.
 *
 * Implement this interface in your infrastructure layer to plug in any storage
 * backend (PostgreSQL, MongoDB, in-memory, etc.).
 *
 * @public
 */
export interface AccountRepository {
  /**
   * Persists an account aggregate.
   *
   * On conflict (duplicate ID), implementations should either upsert or throw —
   * document the chosen behaviour clearly in your adapter.
   *
   * @param account - The account to persist.
   */
  save(account: Account): Promise<void>;

  /**
   * Finds an account by its unique identifier.
   *
   * @param id - The {@link AccountId} to look up.
   * @returns The matching account, or `null` when no account exists with that ID.
   */
  findById(id: AccountId): Promise<Account | null>;

  /**
   * Finds an account by its email address.
   *
   * @param email - The normalized {@link EmailAddress} to look up.
   * @returns The matching account, or `null` when no account exists with that email.
   */
  findByEmail(email: EmailAddress): Promise<Account | null>;

  /**
   * Permanently removes an account by its unique identifier.
   *
   * Used by registration flows as a compensating action when a subsequent
   * credential write fails, preventing orphaned accounts with no credential.
   * Implementations should treat a missing ID as a no-op (idempotent).
   *
   * @param id - The {@link AccountId} of the account to remove.
   */
  delete(id: AccountId): Promise<void>;
}
