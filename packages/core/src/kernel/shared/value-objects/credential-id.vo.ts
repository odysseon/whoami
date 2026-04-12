import { InvalidCredentialIdError } from "../errors/domain.error.js";

/**
 * Branded identity for a credential.
 * @public
 */
export class CredentialId {
  public readonly value: string;

  constructor(value: string) {
    if (!value || value.trim() === "") {
      throw new InvalidCredentialIdError("CredentialId cannot be empty.");
    }
    this.value = value;
  }

  equals(other: CredentialId): boolean {
    return this.value === other.value;
  }
}
