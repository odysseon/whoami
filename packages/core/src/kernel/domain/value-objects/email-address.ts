import { InvalidEmailError } from "../errors/index.js";

/**
 * Branded type for EmailAddress - ensures type safety across the system
 */
export type EmailAddress = string & { readonly __brand: "EmailAddress" };

/**
 * Email validation regex - simplified but effective
 * Allows: user@example.com, user+tag@example.co.uk, etc.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Creates an EmailAddress from a string value
 * Normalizes the email (lowercase, trimmed)
 * @param value - The string value to create an EmailAddress from
 * @returns The EmailAddress
 * @throws InvalidEmailError if the value is empty or invalid
 */
export function createEmailAddress(value: string): EmailAddress {
  if (typeof value !== "string") {
    throw new InvalidEmailError("Email must be a string");
  }

  const normalized = value.toLowerCase().trim();

  if (normalized.length === 0) {
    throw new InvalidEmailError("Email cannot be empty");
  }

  if (!EMAIL_REGEX.test(normalized)) {
    throw new InvalidEmailError(`Invalid email format: ${value}`);
  }

  return normalized as EmailAddress;
}

/**
 * Type guard for EmailAddress
 * @param value - The value to check
 * @returns True if the value is a valid EmailAddress
 */
export function isEmailAddress(value: unknown): value is EmailAddress {
  return typeof value === "string" && EMAIL_REGEX.test(value);
}
