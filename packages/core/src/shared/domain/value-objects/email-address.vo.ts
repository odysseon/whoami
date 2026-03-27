export class EmailAddress {
  public readonly value: string;

  constructor(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed || !trimmed.includes("@")) {
      throw new Error("Invalid email format");
    }
    this.value = trimmed.toLowerCase();
  }

  public equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }
}
