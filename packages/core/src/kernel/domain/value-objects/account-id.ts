import { InvalidAccountIdError } from "../errors/index.js";

/**
 * Branded type for AccountId - ensures type safety across the system
 */
export type AccountId = string & { readonly __brand: "AccountId" };

/**
 * Creates an AccountId from a string value
 */
export function createAccountId(value: string): AccountId {
  if (typeof value !== "string" || value.length === 0) {
    throw new InvalidAccountIdError("AccountId cannot be empty");
  }
  return value as AccountId;
}

/**
 * Type guard for AccountId
 */
export function isAccountId(value: unknown): value is AccountId {
  return typeof value === "string" && value.length > 0;
}

/**
 * Converts a string to AccountId without validation.
 * Use ONLY when the string is already validated (e.g., from a branded source).
 */
export function toAccountId(value: string): AccountId {
  return value as AccountId;
}
