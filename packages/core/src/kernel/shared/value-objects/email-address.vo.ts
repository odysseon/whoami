import { InvalidEmailError } from "../errors/domain.error.js";

/**
 * Validated, normalized email address value object.
 * @public
 */
export class EmailAddress {
  public readonly value: string;

  constructor(raw: string) {
    const normalized = raw.trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new InvalidEmailError(`"${raw}" is not a valid email address.`);
    }
    this.value = normalized;
  }

  equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }
}
