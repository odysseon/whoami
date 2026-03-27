import {
  AccountId,
  EmailAddress,
} from "../../../shared/domain/value-objects/index.js";
import { Account } from "./account.entity.js";

/**
 * Persists and retrieves account aggregates.
 */
export interface AccountRepository {
  /**
   * Stores an account aggregate.
   *
   * @param account - The account to persist.
   */
  save(account: Account): Promise<void>;

  /**
   * Finds an account by its identifier.
   *
   * @param id - The account identifier.
   * @returns The matching account, or `null` when no account exists.
   */
  findById(id: AccountId): Promise<Account | null>;

  /**
   * Finds an account by its email address.
   *
   * @param email - The normalized email address.
   * @returns The matching account, or `null` when no account exists.
   */
  findByEmail(email: EmailAddress): Promise<Account | null>;
}
