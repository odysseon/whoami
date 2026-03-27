import {
  AccountId,
  EmailAddress,
} from "src/shared/domain/value-objects/index.js";
import { Account } from "./account.entity.js";

export interface AccountRepository {
  // Command: Persist the pure domain entity
  save(account: Account): Promise<void>;

  // Queries: Lookup using our strictly validated Value Objects
  findById(id: AccountId): Promise<Account | null>;
  findByEmail(email: EmailAddress): Promise<Account | null>;
}
