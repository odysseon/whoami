import type { Account } from "../domain/entities/account.js";
import type { AccountId } from "../domain/value-objects/index.js";

export interface AccountCommandPort {
  save(account: Account): Promise<void>;
  delete(id: AccountId): Promise<void>;
}
