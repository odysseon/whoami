import type { Account } from "../domain/entities/account.js";
import type { AccountId, EmailAddress } from "../domain/value-objects/index.js";

export interface AccountQueryPort {
  findById(id: AccountId): Promise<Account | null>;
  findByEmail(email: EmailAddress): Promise<Account | null>;
  existsByEmail(email: EmailAddress): Promise<boolean>;
}
