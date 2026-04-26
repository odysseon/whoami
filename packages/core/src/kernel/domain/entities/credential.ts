import type { AccountId, CredentialId } from "../value-objects/index.js";
import {
  InvalidCredentialError,
  WrongCredentialTypeError,
} from "../errors/index.js";

/**
 * Base interface for all credential proofs
 */
export interface CredentialProof {
  readonly kind: string;
}

/**
 * Credential entity represents an authentication credential for an account.
 * Each credential has a proof that contains the actual authentication data.
 */
export class Credential<T extends CredentialProof = CredentialProof> {
  readonly #id: CredentialId;
  readonly #accountId: AccountId;
  readonly #proof: T;
  readonly #createdAt: Date;

  private constructor(props: {
    id: CredentialId;
    accountId: AccountId;
    proof: T;
    createdAt: Date;
  }) {
    this.#id = props.id;
    this.#accountId = props.accountId;
    this.#proof = props.proof;
    this.#createdAt = props.createdAt;
  }

  /**
   * Creates a new credential with the given proof
   * @param props - The credential properties
   * @returns A new Credential instance
   */
  static create<T extends CredentialProof>(props: {
    id: CredentialId;
    accountId: AccountId;
    proof: T;
    createdAt?: Date;
  }): Credential<T> {
    if (!props.proof) {
      throw new InvalidCredentialError("Proof cannot be empty");
    }

    return new Credential({
      id: props.id,
      accountId: props.accountId,
      proof: props.proof,
      createdAt: props.createdAt ?? new Date(),
    });
  }

  /**
   * Rehydrates a Credential from persisted data
   * @param props - The credential properties
   * @returns A Credential instance
   */
  static load<T extends CredentialProof>(props: {
    id: CredentialId;
    accountId: AccountId;
    proof: T;
    createdAt: Date;
  }): Credential<T> {
    return new Credential(props);
  }

  get id(): CredentialId {
    return this.#id;
  }

  get accountId(): AccountId {
    return this.#accountId;
  }

  get proof(): T {
    return this.#proof;
  }

  get kind(): string {
    return this.#proof.kind;
  }

  get createdAt(): Date {
    return this.#createdAt;
  }

  /**
   * Gets the proof if it matches the expected kind
   * @param kind - The expected proof kind
   * @returns The proof
   * @throws WrongCredentialTypeError if the kind doesn't match
   */
  getProofOfKind<K extends T>(kind: K["kind"]): K {
    if (this.#proof.kind !== kind) {
      throw new WrongCredentialTypeError(kind, this.#proof.kind);
    }
    return this.#proof as K;
  }

  /**
   * Returns a plain object representation of the credential
   */
  toJSON(): {
    id: string;
    accountId: string;
    kind: string;
    createdAt: string;
  } {
    return {
      id: this.#id,
      accountId: this.#accountId,
      kind: this.#proof.kind,
      createdAt: this.#createdAt.toISOString(),
    };
  }
}
