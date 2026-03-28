import { WrongCredentialTypeError } from "../../../shared/domain/errors/auth.error.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { CredentialId } from "../../../shared/domain/value-objects/credential-id.vo.js";
import { CredentialProof } from "./types.js";

/**
 * Represents an authentication credential bound to an account.
 */
export class Credential {
  private constructor(
    public readonly id: CredentialId,
    public readonly accountId: AccountId,
    private readonly proof: CredentialProof,
  ) {}

  /**
   * Rehydrates a credential from persisted state.
   *
   * @param id - The credential identifier.
   * @param accountId - The owning account identifier.
   * @param proof - The persisted proof payload.
   * @returns A credential instance.
   */
  public static loadExisting(
    id: CredentialId,
    accountId: AccountId,
    proof: CredentialProof,
  ): Credential {
    return new Credential(id, accountId, proof);
  }

  /**
   * Returns the stored password hash for password credentials.
   *
   * @returns The stored password hash.
   * @throws {WrongCredentialTypeError} When the credential is not password-based.
   */
  public getPasswordHash(): string {
    if (this.proof.kind !== "password") {
      throw new WrongCredentialTypeError("password", this.proof.kind);
    }

    return this.proof.hash;
  }

  /**
   * Verifies a magic-link token against the stored proof and expiry.
   *
   * @param currentTime - The current time used for expiry evaluation.
   * @param providedToken - The token presented by the client.
   * @returns `true` when the token matches and has not expired.
   * @throws {WrongCredentialTypeError} When the credential is not magic-link based.
   */
  public isMagicLinkValid(currentTime: Date, providedToken: string): boolean {
    if (this.proof.kind !== "magic_link") {
      throw new WrongCredentialTypeError("magic_link", this.proof.kind);
    }

    if (!this.proof.expiresAt || Number.isNaN(this.proof.expiresAt.getTime())) {
      return false;
    }

    const isNotExpired = currentTime.getTime() < this.proof.expiresAt.getTime();
    const isTokenMatch = this.proof.token === providedToken;

    return isNotExpired && isTokenMatch;
  }

  /**
   * Factory for minting a BRAND NEW OAuth credential.
   */
  public static createOAuth(
    id: CredentialId,
    accountId: AccountId,
    provider: string,
    providerId: string,
  ): Credential {
    if (!provider || !providerId) {
      throw new Error("OAuth provider and providerId cannot be empty.");
    }

    return new Credential(id, accountId, {
      kind: "oauth",
      provider,
      providerId,
    });
  }

  /**
   * Evaluates if the provided OAuth data matches the stored credential.
   */
  public verifyOAuth(provider: string, providerId: string): boolean {
    if (this.proof.kind !== "oauth") {
      throw new WrongCredentialTypeError("oauth", this.proof.kind);
    }

    return (
      this.proof.provider === provider && this.proof.providerId === providerId
    );
  }
}
