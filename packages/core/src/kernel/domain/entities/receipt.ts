import type { AccountId } from "../value-objects/index.js";

/**
 * Public receipt shape — no branded types, Date stays as Date.
 * Derived from Receipt.toDTO() — single source of truth.
 */
export type ReceiptDTO = { token: string; accountId: string; expiresAt: Date };

/**
 * Receipt represents a successful authentication.
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

  static create(props: {
    token: string;
    accountId: AccountId;
    expiresAt: Date;
  }): Receipt {
    return new Receipt(props);
  }

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

  isExpired(now: Date = new Date()): boolean {
    return now >= this.#expiresAt;
  }

  /**
   * Plain object for serialization (API responses, logging, etc.)
   */
  toJSON(): { token: string; accountId: string; expiresAt: string } {
    return {
      token: this.#token,
      accountId: this.#accountId,
      expiresAt: this.#expiresAt.toISOString(),
    };
  }

  /**
   * Typed DTO for module facade returns — Date stays as Date for runtime use.
   */
  toDTO(): ReceiptDTO {
    return {
      token: this.#token,
      accountId: this.#accountId,
      expiresAt: this.#expiresAt,
    };
  }
}
