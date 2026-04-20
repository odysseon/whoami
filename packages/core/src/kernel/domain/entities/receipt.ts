import type { AccountId } from "../value-objects/index.js";

/**
 * Receipt represents a successful authentication.
 * Contains everything a route handler needs to identify the request.
 */
export class Receipt {
  readonly #token: string;
  readonly #accountId: AccountId;
  readonly #expiresAt: Date;

  private constructor(props: {
    token: string;
    accountId: AccountId;
    expiresAt: Date;
  }) {
    this.#token = props.token;
    this.#accountId = props.accountId;
    this.#expiresAt = props.expiresAt;
  }

  /**
   * Creates a new Receipt
   * @param props - The receipt properties
   * @returns A new Receipt instance
   */
  static create(props: {
    token: string;
    accountId: AccountId;
    expiresAt: Date;
  }): Receipt {
    return new Receipt(props);
  }

  /**
   * Rehydrates a Receipt from persisted or transmitted data
   * @param props - The receipt properties
   * @returns A Receipt instance
   */
  static load(props: {
    token: string;
    accountId: AccountId;
    expiresAt: Date;
  }): Receipt {
    return new Receipt(props);
  }

  get token(): string {
    return this.#token;
  }

  get accountId(): AccountId {
    return this.#accountId;
  }

  get expiresAt(): Date {
    return this.#expiresAt;
  }

  /**
   * Checks if the receipt has expired
   * @param now - The current time (defaults to new Date())
   * @returns True if the receipt has expired
   */
  isExpired(now: Date = new Date()): boolean {
    return now >= this.#expiresAt;
  }

  /**
   * Returns a plain object representation of the receipt
   */
  toJSON(): { token: string; accountId: string; expiresAt: string } {
    return {
      token: this.#token,
      accountId: this.#accountId,
      expiresAt: this.#expiresAt.toISOString(),
    };
  }
}
