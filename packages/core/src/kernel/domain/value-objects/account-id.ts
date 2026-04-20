import { InvalidAccountIdError } from "../errors/index.js";

/**
 * Branded type for AccountId - ensures type safety across the system
 */
export type AccountId = string & { readonly __brand: "AccountId" };

/**
 * Creates an AccountId from a string value
 * @param value - The string value to create an AccountId from
 * @returns The AccountId
 * @throws InvalidAccountIdError if the value is empty
 */
export function createAccountId(value: string): AccountId {
  if (typeof value !== "string" || value.length === 0) {
    throw new InvalidAccountIdError("AccountId cannot be empty");
  }
  return value as AccountId;
}

/**
 * Type guard for AccountId
 * @param value - The value to check
 * @returns True if the value is a valid AccountId
 */
export function isAccountId(value: unknown): value is AccountId {
  return typeof value === "string" && value.length > 0;
}
