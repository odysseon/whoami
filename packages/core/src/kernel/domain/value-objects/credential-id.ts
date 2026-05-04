import { InvalidCredentialIdError } from "../errors/index.js";

/**
 * Branded type for CredentialId - ensures type safety across the system
 */
export type CredentialId = string & { readonly __brand: "CredentialId" };

/**
 * Creates a CredentialId from a string value
 * @param value - The string value to create a CredentialId from
 * @returns The CredentialId
 * @throws InvalidCredentialIdError if the value is empty
 */
export function createCredentialId(value: string): CredentialId {
  if (typeof value !== "string" || value.length === 0) {
    throw new InvalidCredentialIdError("CredentialId cannot be empty");
  }
  return value as CredentialId;
}

/**
 * Type guard for CredentialId
 * @param value - The value to check
 * @returns True if the value is a valid CredentialId
 */
export function isCredentialId(value: unknown): value is CredentialId {
  return typeof value === "string" && value.length > 0;
}
