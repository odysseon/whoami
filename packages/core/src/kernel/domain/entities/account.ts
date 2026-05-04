import {
  type AccountId,
  type EmailAddress,
  createAccountId,
  createEmailAddress,
} from "../value-objects/index.js";
import { InvalidAccountIdError, InvalidEmailError } from "../errors/index.js";

export interface AccountProps {
  readonly id: AccountId;
  readonly email: EmailAddress;
  readonly createdAt: Date;
}

export type AccountDTO = { id: string; email: string; createdAt: Date };

export class Account {
  readonly #id: AccountId;
  readonly #email: EmailAddress;
  readonly #createdAt: Date;

  private constructor(props: AccountProps) {
    this.#id = props.id;
    this.#email = props.email;
    this.#createdAt = props.createdAt;
  }

  static create(props: {
    id: AccountId;
    email: EmailAddress;
    createdAt?: Date;
  }): Account {
    return new Account({
      id: props.id,
      email: props.email,
      createdAt: props.createdAt ?? new Date(),
    });
  }

  static load(props: { id: string; email: string; createdAt: Date }): Account {
    if (!props.id || props.id.length === 0)
      throw new InvalidAccountIdError("Account ID cannot be empty");
    if (!props.email || props.email.length === 0)
      throw new InvalidEmailError("Email cannot be empty");
    return new Account({
      id: createAccountId(props.id),
      email: createEmailAddress(props.email),
      createdAt: props.createdAt,
    });
  }

  get id(): AccountId {
    return this.#id;
  }
  get email(): EmailAddress {
    return this.#email;
  }
  get createdAt(): Date {
    return this.#createdAt;
  }

  isExpired(now: Date = new Date()): boolean {
    return now >= this.#createdAt;
  }

  toJSON(): { id: string; email: string; createdAt: string } {
    return {
      id: this.#id,
      email: this.#email,
      createdAt: this.#createdAt.toISOString(),
    };
  }

  toDTO(): AccountDTO {
    return { id: this.#id, email: this.#email, createdAt: this.#createdAt };
  }
}
