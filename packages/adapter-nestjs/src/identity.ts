import type { AccountId } from "@odysseon/whoami-core";

/**
 * Sanitized identity attached to the request after guard verification.
 * Contains no sensitive tokens — safe for logging, serialization, caching.
 */
export interface RequestIdentity {
  readonly accountId: AccountId;
  readonly expiresAt: Date;
}
