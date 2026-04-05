import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { CredentialId } from "../../../shared/domain/value-objects/credential-id.vo.js";
import { WrongCredentialTypeError } from "../../../shared/domain/errors/auth.error.js";
import { InvalidCredentialError } from "../../../shared/domain/errors/validation.error.js";
import { CredentialProof } from "./types.js";

/** @internal */
interface CredentialConstructorProps {
  id: CredentialId;
  accountId: AccountId;
  proof: CredentialProof;
}

/**
 * Props for {@link Credential.createPassword}.
 * @public
 */
export interface CreatePasswordProps {
  /** Unique identifier for this credential. */
  id: CredentialId;
  /** The account this credential belongs to. */
  accountId: AccountId;
  /** The hashed password string (never plain-text). */
  hash: string;
}

/**
 * Props for {@link Credential.createMagicLink}.
 * @public
 */
export interface CreateMagicLinkProps {
  /** Unique identifier for this credential. */
  id: CredentialId;
  /** The account this credential belongs to. */
  accountId: AccountId;
  /** The opaque token value sent to the user's inbox. */
  token: string;
  /** UTC timestamp after which the token is invalid. */
  expiresAt: Date;
}

/**
 * Props for {@link Credential.createOAuth}.
 * @public
 */
export interface CreateOAuthProps {
  /** Unique identifier for this credential. */
  id: CredentialId;
  /** The account this credential belongs to. */
  accountId: AccountId;
  /** OAuth provider name, e.g. `"google"`. */
  provider: string;
  /** The stable user identifier returned by the provider (`sub` claim). */
  providerId: string;
}

/**
 * Props for {@link Credential.loadExisting}.
 * @public
 */
export interface LoadExistingProps {
  /** Unique identifier for this credential. */
  id: CredentialId;
  /** The account this credential belongs to. */
  accountId: AccountId;
  /** The full proof discriminated union reconstructed from storage. */
  proof: CredentialProof;
}

/**
 * Represents an authentication credential bound to a single account.
 *
 * A credential holds a typed proof (`password`, `magic_link`, or `oauth`)
 * that is used by the corresponding authentication flow.  Accessing a proof
 * field for the wrong kind raises a {@link WrongCredentialTypeError} so that
 * misuse is caught at runtime without casting.
 *
 * Use the named static factories to create new credentials:
 * - {@link Credential.createPassword}
 * - {@link Credential.createMagicLink}
 * - {@link Credential.createOAuth}
 *
 * Use {@link Credential.loadExisting} only when rehydrating from a trusted store.
 *
 * @public
 */
export class Credential {
  /** The unique credential identifier. */
  public readonly id: CredentialId;
  /** The account this credential is bound to. */
  public readonly accountId: AccountId;
  /** The proof kind discriminant; use to narrow the proof type. */
  public readonly proofKind: CredentialProof["kind"];

  private readonly proof: CredentialProof;

  private constructor(props: CredentialConstructorProps) {
    this.id = props.id;
    this.accountId = props.accountId;
    this.proof = props.proof;
    this.proofKind = props.proof.kind;
  }

  // ── Proof accessors ──────────────────────────────────────────────────────

  /**
   * The hashed password string.
   *
   * @throws {WrongCredentialTypeError} When the credential is not a password credential.
   */
  public get passwordHash(): string {
    if (this.proof.kind !== "password") {
      throw new WrongCredentialTypeError("password", this.proof.kind);
    }
    return this.proof.hash;
  }

  /**
   * The opaque magic-link token value.
   *
   * @throws {WrongCredentialTypeError} When the credential is not a magic-link credential.
   */
  public get magicLinkToken(): string {
    if (this.proof.kind !== "magic_link") {
      throw new WrongCredentialTypeError("magic_link", this.proof.kind);
    }
    return this.proof.token;
  }

  /**
   * The UTC expiry timestamp of the magic-link token.
   *
   * @throws {WrongCredentialTypeError} When the credential is not a magic-link credential.
   */
  public get magicLinkExpiresAt(): Date {
    if (this.proof.kind !== "magic_link") {
      throw new WrongCredentialTypeError("magic_link", this.proof.kind);
    }
    return this.proof.expiresAt;
  }

  /**
   * The OAuth provider name (e.g. `"google"`).
   *
   * @throws {WrongCredentialTypeError} When the credential is not an OAuth credential.
   */
  public get oauthProvider(): string {
    if (this.proof.kind !== "oauth") {
      throw new WrongCredentialTypeError("oauth", this.proof.kind);
    }
    return this.proof.provider;
  }

  /**
   * The OAuth provider's stable user identifier (`sub` claim).
   *
   * @throws {WrongCredentialTypeError} When the credential is not an OAuth credential.
   */
  public get oauthProviderId(): string {
    if (this.proof.kind !== "oauth") {
      throw new WrongCredentialTypeError("oauth", this.proof.kind);
    }
    return this.proof.providerId;
  }

  // ── Named factories ──────────────────────────────────────────────────────

  /**
   * Creates a new password credential.
   *
   * @param props - {@link CreatePasswordProps}
   * @throws {InvalidCredentialError} When `hash` is empty or blank.
   * @returns A new password {@link Credential}.
   */
  public static createPassword(props: CreatePasswordProps): Credential {
    if (!props.hash || props.hash.trim() === "") {
      throw new InvalidCredentialError("Password hash cannot be empty.");
    }

    return new Credential({
      id: props.id,
      accountId: props.accountId,
      proof: { kind: "password", hash: props.hash },
    });
  }

  /**
   * Creates a new magic-link credential.
   *
   * @param props - {@link CreateMagicLinkProps}
   * @throws {InvalidCredentialError} When `token` is empty or blank.
   * @returns A new magic-link {@link Credential}.
   */
  public static createMagicLink(props: CreateMagicLinkProps): Credential {
    if (!props.token || props.token.trim() === "") {
      throw new InvalidCredentialError("Magic-link token cannot be empty.");
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

  /**
   * Creates a new OAuth credential.
   *
   * @param props - {@link CreateOAuthProps}
   * @throws {InvalidCredentialError} When `provider` or `providerId` is empty or blank.
   * @returns A new OAuth {@link Credential}.
   */
  public static createOAuth(props: CreateOAuthProps): Credential {
    if (!props.provider || props.provider.trim() === "") {
      throw new InvalidCredentialError("OAuth provider cannot be empty.");
    }
    if (!props.providerId || props.providerId.trim() === "") {
      throw new InvalidCredentialError("OAuth providerId cannot be empty.");
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
   * Rehydrates a persisted credential from trusted storage.
   *
   * Bypasses all creation-time business rules — only use this when
   * reconstructing a credential that was previously validated and stored.
   *
   * @param props - {@link LoadExistingProps}
   * @returns The rehydrated {@link Credential}.
   */
  public static loadExisting(props: LoadExistingProps): Credential {
    return new Credential({
      id: props.id,
      accountId: props.accountId,
      proof: props.proof,
    });
  }
}
