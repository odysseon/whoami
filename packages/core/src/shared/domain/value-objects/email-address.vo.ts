import { InvalidEmailError } from "../errors/validation.error.js";

export class EmailAddress {
  public readonly value: string;

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

  public equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }
}
