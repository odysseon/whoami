import { AccountId, Brand } from "src/shared/domain/types.js";

export type CredentialId = Brand<string, "CredentialId">;

export type PasswordProof = { kind: "password"; hash: string };
export type MagicLinkProof = {
  kind: "magic_link";
  token: string;
  expiresAt: Date;
};
export type OAuthProof = {
  kind: "oauth";
  provider: "github" | "google";
  providerId: string;
};

export type CredentialProof = PasswordProof | MagicLinkProof | OAuthProof;

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

  public getPasswordHash(): string {
    if (this._proof.kind !== "password") {
      throw new Error("This credential is not a password type.");
    }
    return this._proof.hash;
  }

  public isMagicLinkValid(currentTime: Date, providedToken: string): boolean {
    if (this._proof.kind !== "magic_link") {
      throw new Error("This credential is not a magic link.");
    }
    return (
      this._proof.token === providedToken &&
      currentTime <= this._proof.expiresAt
    );
  }
}
