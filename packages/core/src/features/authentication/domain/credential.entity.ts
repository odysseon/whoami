import { AccountId } from "src/shared/domain/value-objects/account-id.vo.js";
import { CredentialId } from "src/shared/domain/value-objects/credential-id.vo.js";
import { CredentialProof } from "./types.js";
import { WrongCredentialTypeError } from "src/shared/domain/errors/auth.error.js";

export class Credential {
  private constructor(
    public readonly id: CredentialId,
    public readonly accountId: AccountId,
    private _proof: CredentialProof,
  ) {}

  public static loadExisting(
    id: CredentialId,
    accountId: AccountId,
    proof: CredentialProof,
  ): Credential {
    return new Credential(id, accountId, proof);
  }

  // --- BUSINESS BEHAVIOR ---

  /**
   * Safely extracts the password hash.
   * Throws a pure DomainError if called on a Magic Link credential.
   */
  public getPasswordHash(): string {
    if (this._proof.kind !== "password") {
      throw new WrongCredentialTypeError("password", this._proof.kind);
    }
    return this._proof.hash;
  }

  /**
   * Evaluates if a magic link is valid based on a strictly provided current time.
   * Time is an input, making this 100% reliably testable.
   */
  public isMagicLinkValid(currentTime: Date, providedToken: string): boolean {
    if (this._proof.kind !== "magic_link") {
      throw new WrongCredentialTypeError("magic_link", this._proof.kind);
    }

    if (!this._proof.expiresAt || isNaN(this._proof.expiresAt.getTime())) {
      return false;
    }

    const isNotExpired =
      currentTime.getTime() < this._proof.expiresAt.getTime();
    const isTokenMatch = this._proof.token === providedToken;

    return isNotExpired && isTokenMatch;
  }
}
