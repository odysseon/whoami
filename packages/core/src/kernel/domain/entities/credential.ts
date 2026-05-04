import type { AccountId, CredentialId } from "../value-objects/index.js";
import {
  InvalidCredentialError,
  WrongCredentialTypeError,
} from "../errors/index.js";

export interface CredentialProof {
  readonly kind: string;
}

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

  getProofOfKind<K extends T>(kind: K["kind"]): K {
    if (this.#proof.kind !== kind) {
      throw new WrongCredentialTypeError(kind, this.#proof.kind);
    }
    return this.#proof as K;
  }

  toJSON(): { id: string; accountId: string; kind: string; createdAt: string } {
    return {
      id: this.#id,
      accountId: this.#accountId,
      kind: this.#proof.kind,
      createdAt: this.#createdAt.toISOString(),
    };
  }
}
