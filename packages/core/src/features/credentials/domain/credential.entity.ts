import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { CredentialId } from "../../../shared/domain/value-objects/credential-id.vo.js";
import { WrongCredentialTypeError } from "../../../shared/index.js";
import { CredentialProof } from "./types.js";

interface CredentialConstructorProps {
  id: CredentialId;
  accountId: AccountId;
  proof: CredentialProof;
}

interface CreatePasswordProps {
  id: CredentialId;
  accountId: AccountId;
  hash: string;
}

interface CreateMagicLinkProps {
  id: CredentialId;
  accountId: AccountId;
  token: string;
  expiresAt: Date;
}

interface CreateOAuthProps {
  id: CredentialId;
  accountId: AccountId;
  provider: string;
  providerId: string;
}

interface LoadExistingProps {
  id: CredentialId;
  accountId: AccountId;
  proof: CredentialProof;
}

/**
 * Represents an authentication credential bound to an account.
 */
export class Credential {
  public readonly id: CredentialId;
  public readonly accountId: AccountId;
  private readonly proof: CredentialProof;

  private constructor(props: CredentialConstructorProps) {
    this.id = props.id;
    this.accountId = props.accountId;
    this.proof = props.proof;
  }
  public get passwordHash(): string {
    if (this.proof.kind !== "password") {
      throw new WrongCredentialTypeError("password", this.proof.kind);
    }
    return this.proof.hash;
  }

  public static createPassword(props: CreatePasswordProps): Credential {
    if (!props.hash) {
      throw new Error("Password hash cannot be empty.");
    }

    return new Credential({
      id: props.id,
      accountId: props.accountId,
      proof: {
        kind: "password",
        hash: props.hash,
      },
    });
  }

  public static createMagicLink(props: CreateMagicLinkProps): Credential {
    if (!props.token) {
      throw new Error("Magic link token cannot be empty.");
    }

    return new Credential({
      id: props.id,
      accountId: props.accountId,
      proof: {
        kind: "magic_link",
        token: props.token,
        expiresAt: props.expiresAt,
      },
    });
  }

  public static createOAuth(props: CreateOAuthProps): Credential {
    if (!props.provider || !props.providerId) {
      throw new Error("OAuth provider and providerId cannot be empty.");
    }

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

  /**
   * Rehydrates a persisted credential from storage.
   * Bypasses creation business rules — use only when reconstructing from a trusted store.
   */
  public static loadExisting(props: LoadExistingProps): Credential {
    return new Credential({
      id: props.id,
      accountId: props.accountId,
      proof: props.proof,
    });
  }

  public get magicLinkToken(): string {
    if (this.proof.kind !== "magic_link") {
      throw new WrongCredentialTypeError("magic_link", this.proof.kind);
    }
    return this.proof.token;
  }

  public get magicLinkExpiresAt(): Date {
    if (this.proof.kind !== "magic_link") {
      throw new WrongCredentialTypeError("magic_link", this.proof.kind);
    }
    return this.proof.expiresAt;
  }

  public get oauthProvider(): string {
    if (this.proof.kind !== "oauth") {
      throw new WrongCredentialTypeError("oauth", this.proof.kind);
    }
    return this.proof.provider;
  }

  public get oauthProviderId(): string {
    if (this.proof.kind !== "oauth") {
      throw new WrongCredentialTypeError("oauth", this.proof.kind);
    }
    return this.proof.providerId;
  }

  public get proofKind(): CredentialProof["kind"] {
    return this.proof.kind;
  }
}
