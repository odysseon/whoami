import type { AccountCommandPort } from "./account-command.port.js";
import type { AccountQueryPort } from "./account-query.port.js";

/**
 * Full repository — convenience intersection of query and command ports.
 * Existing consumers can continue using this; new consumers may prefer
 * the granular ports for stricter interface segregation.
 */
export interface AccountRepository
  extends AccountQueryPort, AccountCommandPort {}
