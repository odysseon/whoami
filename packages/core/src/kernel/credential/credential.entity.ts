import {
  AccountId,
  CredentialId,
  InvalidCredentialError,
} from "../shared/index.js";
import type { CredentialProof } from "./credential.proof.port.js";
import { PasswordProof, OAuthProof } from "./credential.types.js";

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
 * The kernel treats the `proof` as an opaque {@link CredentialProof}. Typed
 * fields (hash, provider, providerId) are no longer accessible here — use the
 * module-level domain wrappers (`PasswordCredential`, `OAuthCredential`) which
 * call `getProof()` and narrow the kind themselves.
 *
 * Use named static factories to create; {@link Credential.loadExisting} only
 * when rehydrating from a trusted store.
 * @public
 */
export class Credential {
  public readonly id: CredentialId;
  public readonly accountId: AccountId;
  public readonly proofKind: string;
  private readonly _proof: CredentialProof;

  private constructor(props: CredentialProps) {
    this.id = props.id;
    this.accountId = props.accountId;
    this._proof = props.proof;
    this.proofKind = props.proof.kind;
  }

  /**
   * Returns the opaque proof for this credential.
   *
   * Callers must narrow on `proof.kind` before accessing module-specific
   * fields. Prefer the module-level wrappers (`PasswordCredential.fromKernel`,
   * `OAuthCredential.fromKernel`) over direct proof access.
   */
  public getProof(): CredentialProof {
    return this._proof;
  }

  public static createPassword(props: CreatePasswordProps): Credential {
    if (!props.hash || props.hash.trim() === "")
      throw new InvalidCredentialError("Password hash cannot be empty.");
    return new Credential({
      id: props.id,
      accountId: props.accountId,
      proof: new PasswordProof(props.hash),
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
      proof: new OAuthProof(props.provider, props.providerId),
    });
  }

  public static loadExisting(props: LoadExistingProps): Credential {
    return new Credential(props);
  }
}
