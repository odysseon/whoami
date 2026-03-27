export class AccountId {
  public readonly value: string | number;

  constructor(raw: string | number) {
    if (raw === undefined || raw === null || String(raw).trim() === "") {
      throw new Error("AccountId cannot be empty");
    }
    this.value = raw;
  }

  public equals(other: AccountId): boolean {
    return this.value === other.value;
  }
}
