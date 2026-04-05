import { InvalidEmailError } from "../errors/validation.error.js";

/**
 * Value object that wraps a validated, normalized email address string.
 *
 * Validation is intentionally liberal — it checks structural shape (a single
 * `@` with a domain containing a `.`) rather than attempting to implement the
 * full RFC 5321 grammar.  The value is lowercased on construction so that
 * comparisons are case-insensitive and storage is canonical.
 *
 * @example
 * ```ts
 * const email = new EmailAddress("User@Example.COM");
 * email.value; // "user@example.com"
 * email.equals(new EmailAddress("user@example.com")); // true
 * ```
 *
 * @public
 */
export class EmailAddress {
  /** The lowercased, trimmed email string. */
  public readonly value: string;

  /**
   * @param raw - The raw email string supplied by the caller.
   * @throws {InvalidEmailError} When `raw` does not conform to a minimal email shape.
   */
  constructor(raw: string) {
    const trimmed = raw.trim();
    const atIndex = trimmed.indexOf("@");
    const isValid =
      trimmed.length > 0 &&
      atIndex > 0 &&
      atIndex === trimmed.lastIndexOf("@") &&
      atIndex < trimmed.length - 1 &&
      trimmed.slice(atIndex + 1).includes(".");

    if (!isValid) {
      throw new InvalidEmailError();
    }

    this.value = trimmed.toLowerCase();
  }

  /**
   * Structural equality check.
   *
   * @param other - The other {@link EmailAddress} to compare against.
   * @returns `true` when both addresses hold the same normalized string.
   */
  public equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }
}
