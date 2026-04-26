import type { Account } from "../domain/entities/account.js";
import type { AccountId, EmailAddress } from "../domain/value-objects/index.js";

/**
 * Port for account persistence operations.
 * Implemented by infrastructure adapters (e.g., database repositories).
 */
export interface AccountRepository {
  /**
   * Saves an account to the repository
   * @param account - The account to save
   */
  save(account: Account): Promise<void>;

  /**
   * Finds an account by its ID
   * @param id - The account ID
   * @returns The account if found, null otherwise
   */
  findById(id: AccountId): Promise<Account | null>;

  /**
   * Finds an account by email address
   * @param email - The email address
   * @returns The account if found, null otherwise
   */
  findByEmail(email: EmailAddress): Promise<Account | null>;

  /**
   * Deletes an account from the repository
   * @param id - The account ID
   */
  delete(id: AccountId): Promise<void>;

  /**
   * Checks if an account exists with the given email
   * @param email - The email address
   * @returns True if an account exists
   */
  existsByEmail(email: EmailAddress): Promise<boolean>;
}
