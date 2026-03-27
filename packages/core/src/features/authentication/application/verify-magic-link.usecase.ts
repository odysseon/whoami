import { AccountId, EmailAddress } from "src/shared/domain/types.js";
import { CredentialStore } from "../domain/ports/credential-store.port.js";

export class VerifyMagicLinkUseCase {
  constructor(private readonly credentialStore: CredentialStore) {}

  public async execute(
    rawEmail: string,
    token: string,
    currentTime: Date,
  ): Promise<AccountId> {
    const email = this.toEmailAddress(rawEmail);

    const credential = await this.credentialStore.findByEmail(email);
    if (!credential) {
      throw new Error("Invalid or expired magic link");
    }

    let isValid: boolean;
    try {
      isValid = credential.isMagicLinkValid(currentTime, token);
    } catch {
      throw new Error("Invalid authentication method for this account");
    }

    if (!isValid) {
      throw new Error("Invalid or expired magic link");
    }
    return credential.accountId;
  }

  private toEmailAddress(raw: string): EmailAddress {
    if (!raw.includes("@") || raw.trim() === "")
      throw new Error("Invalid email");
    return raw.toLowerCase().trim() as EmailAddress;
  }
}
