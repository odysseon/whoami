import { DomainError } from "../errors/domain.error.js";

export class InvalidCredentialIdError extends DomainError {
  public readonly code = "INVALID_CREDENTIAL_ID" as const;

  constructor() {
    super("CredentialId cannot be empty.");
  }
}

export class CredentialId {
  public readonly value: string | number;

  constructor(raw: string | number) {
    if (raw === undefined || raw === null || String(raw).trim() === "") {
      throw new InvalidCredentialIdError();
    }
    this.value = raw;
  }

  public equals(other: CredentialId): boolean {
    return this.value === other.value;
  }
}
