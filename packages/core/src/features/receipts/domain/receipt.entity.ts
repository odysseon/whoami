import { InvalidReceiptError } from "../../../shared/domain/errors/auth.error.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";

/**
 * Input for {@link Receipt.issue}.
 * @public
 */
export interface ReceiptIssuanceInput {
  /** The signed token string produced by the {@link ReceiptSigner}. */
  token: string;
  accountId: AccountId;
  expiresAt: Date;
  /**
   * The current time, injected for deterministic validation.
   * Must be earlier than `expiresAt` for the receipt to be valid.
   */
  now: Date;
}

/**
 * A signed, time-bounded proof of successful authentication.
 *
 * Receipts are immutable value-objects returned to callers after every
 * successful authentication flow.  They wrap a signed token (e.g. a JWT)
 * together with its expiry metadata so callers never need to decode the token
 * themselves.
 *
 * Use {@link Receipt.issue} to mint a brand-new receipt, and
 * {@link Receipt.loadExisting} to rehydrate one during verification.
 *
 * @public
 */
export class Receipt {
  /** The opaque signed token string (e.g. a JWT). */
  public readonly token: string;
  public readonly accountId: AccountId;
  public readonly expiresAt: Date;

  private constructor(token: string, accountId: AccountId, expiresAt: Date) {
    this.token = token;
    this.accountId = accountId;
    this.expiresAt = expiresAt;
  }

  /**
   * Mints a brand-new receipt from a freshly signed token.
   *
   * Validates that the token is non-empty and that the expiry lies strictly
   * in the future relative to `input.now`.
   *
   * @param input - {@link ReceiptIssuanceInput}
   * @returns A new {@link Receipt}.
   * @throws {InvalidReceiptError} When the token is empty or `expiresAt` is not in the future.
   */
  public static issue(input: ReceiptIssuanceInput): Receipt {
    if (!input.token || input.token.trim() === "") {
      throw new InvalidReceiptError("Token payload cannot be empty.");
    }
    if (!input.expiresAt || input.expiresAt <= input.now) {
      throw new InvalidReceiptError("Expiration date must be in the future.");
    }
    return new Receipt(input.token, input.accountId, input.expiresAt);
  }

  /**
   * Rehydrates an existing receipt during token verification.
   *
   * Bypasses issuance business rules — use **only** when reconstructing a
   * receipt from a token that has already been cryptographically verified.
   *
   * @param token   - The signed token string.
   * @param props   - The account ID and expiry restored from the verified token.
   * @returns The rehydrated {@link Receipt}.
   */
  public static loadExisting(
    token: string,
    props: { accountId: AccountId; expiresAt: Date },
  ): Receipt {
    return new Receipt(token, props.accountId, props.expiresAt);
  }
}
