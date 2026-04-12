import {
  AccountId,
  CredentialId,
  WrongCredentialTypeError,
  InvalidCredentialError,
} from "../shared/index.js";
import type { CredentialProof } from "./credential.types.js";

/** @internal */
interface CredentialProps {
  id: CredentialId;
  accountId: AccountId;
  proof: CredentialProof;
}

export interface CreatePasswordProps {
  id: CredentialId;
  accountId: AccountId;
  /** The hashed password string (never plain-text). */
  hash: string;
}

export interface CreateOAuthProps {
  id: CredentialId;
  accountId: AccountId;
  provider: string;
  providerId: string;
}

export interface LoadExistingProps {
  id: CredentialId;
  accountId: AccountId;
  proof: CredentialProof;
}

/**
 * Authentication credential bound to a single account.
 *
 * Holds a typed proof (password or oauth). Accessing a proof field for the
 * wrong kind raises {@link WrongCredentialTypeError} so misuse is caught at runtime.
 *
 * Use named static factories to create; {@link Credential.loadExisting} only
 * when rehydrating from a trusted store.
 * @public
 */
export class Credential {
  public readonly id: CredentialId;
  public readonly accountId: AccountId;
  public readonly proofKind: CredentialProof["kind"];
  private readonly proof: CredentialProof;

  private constructor(props: CredentialProps) {
    this.id = props.id;
    this.accountId = props.accountId;
    this.proof = props.proof;
    this.proofKind = props.proof.kind;
  }

  public get passwordHash(): string {
    if (this.proof.kind !== "password")
      throw new WrongCredentialTypeError("password", this.proof.kind);
    return this.proof.hash;
  }

  public get oauthProvider(): string {
    if (this.proof.kind !== "oauth")
      throw new WrongCredentialTypeError("oauth", this.proof.kind);
    return this.proof.provider;
  }

  public get oauthProviderId(): string {
    if (this.proof.kind !== "oauth")
      throw new WrongCredentialTypeError("oauth", this.proof.kind);
    return this.proof.providerId;
  }

  public static createPassword(props: CreatePasswordProps): Credential {
    if (!props.hash || props.hash.trim() === "")
      throw new InvalidCredentialError("Password hash cannot be empty.");
    return new Credential({
      id: props.id,
      accountId: props.accountId,
      proof: { kind: "password", hash: props.hash },
    });
  }

  public static createOAuth(props: CreateOAuthProps): Credential {
    if (!props.provider || props.provider.trim() === "")
      throw new InvalidCredentialError("OAuth provider cannot be empty.");
    if (!props.providerId || props.providerId.trim() === "")
      throw new InvalidCredentialError("OAuth providerId cannot be empty.");
    return new Credential({
      id: props.id,
      accountId: props.accountId,
      proof: {
        kind: "oauth",
        provider: props.provider,
        providerId: props.providerId,
      },
    });
  }

  public static loadExisting(props: LoadExistingProps): Credential {
    return new Credential(props);
  }
}
