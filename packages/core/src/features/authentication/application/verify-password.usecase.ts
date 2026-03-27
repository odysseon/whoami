import { AccountId, EmailAddress } from "src/shared/domain/types.js";
import { CredentialStore } from "../domain/ports/credential-store.port.js";
import { PasswordHasher } from "../domain/ports/password-hasher.port.js";

export class VerifyPasswordUseCase {
  constructor(
    private readonly credentialStore: CredentialStore,
    private readonly hasher: PasswordHasher,
  ) {}

  public async execute(
    rawEmail: string,
    plainTextPassword: string,
  ): Promise<AccountId> {
    const email = this.toEmailAddress(rawEmail);

    const credential = await this.credentialStore.findByEmail(email);
    if (!credential) {
      throw new Error("Invalid email or password");
    }

    let storedHash: string;
    try {
      storedHash = credential.getPasswordHash();
    } catch {
      throw new Error("Invalid authentication method for this account");
    }

    const isMatch = await this.hasher.compare(plainTextPassword, storedHash);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    return credential.accountId;
  }

  private toEmailAddress(raw: string): EmailAddress {
    if (!raw.includes("@") || raw.trim() === "") {
      throw new Error("Invalid email format");
    }
    return raw.toLowerCase().trim() as EmailAddress;
  }
}
