import {
  type AccountId,
  type EmailAddress,
  createAccountId,
  createEmailAddress,
} from "../value-objects/index.js";
import { InvalidAccountIdError, InvalidEmailError } from "../errors/index.js";

/**
 * Properties required to create a new Account
 */
export interface AccountProps {
  readonly id: AccountId;
  readonly email: EmailAddress;
  readonly createdAt: Date;
}

/**
 * Account entity represents a user account in the system.
 * This is a kernel entity that all auth modules reference.
 */
export class Account {
  readonly #id: AccountId;
  readonly #email: EmailAddress;
  readonly #createdAt: Date;

  private constructor(props: AccountProps) {
    this.#id = props.id;
    this.#email = props.email;
    this.#createdAt = props.createdAt;
  }

  /**
   * Creates a new Account
   * @param props - The account properties
   * @returns A new Account instance
   */
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

  /**
   * Rehydrates an Account from persisted data
   * @param props - The account properties
   * @returns An Account instance
   */
  static load(props: { id: string; email: string; createdAt: Date }): Account {
    if (!props.id || props.id.length === 0) {
      throw new InvalidAccountIdError("Account ID cannot be empty");
    }
    if (!props.email || props.email.length === 0) {
      throw new InvalidEmailError("Email cannot be empty");
    }

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

  /**
   * Returns a plain object representation of the account
   */
  toJSON(): { id: string; email: string; createdAt: string } {
    return {
      id: this.#id,
      email: this.#email,
      createdAt: this.#createdAt.toISOString(),
    };
  }
}
