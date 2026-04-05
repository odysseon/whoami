import { InvalidConfigurationError } from "../../../shared/domain/errors/validation.error.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { Receipt } from "../domain/receipt.entity.js";
import type { ReceiptSigner } from "../domain/ports/receipt-signer.port.js";

/**
 * Configuration for {@link IssueReceiptUseCase}.
 * @public
 */
export interface IssueReceiptConfig {
  /** The receipt signer implementation. */
  signer: ReceiptSigner;
  /**
   * How long a receipt remains valid, in minutes.
   * Must be a positive integer. Defaults to `60`.
   */
  tokenLifespanMinutes?: number;
  /**
   * Clock factory — returns the current wall-clock time.
   * Defaults to `() => new Date()`.
   * Override in tests to produce fully deterministic output.
   */
  now?: () => Date;
}

/**
 * Issues a signed {@link Receipt} for a successfully authenticated account.
 *
 * Computes a single `now` snapshot and derives `expiresAt` from it so that the
 * token and the receipt metadata always agree — no skew between sign time and
 * validation time.
 *
 * @public
 */
export class IssueReceiptUseCase {
  private readonly signer: ReceiptSigner;
  private readonly tokenLifespanMinutes: number;
  private readonly now: () => Date;

  constructor(config: IssueReceiptConfig) {
    this.signer = config.signer;
    this.tokenLifespanMinutes = config.tokenLifespanMinutes ?? 60;
    this.now = config.now ?? ((): Date => new Date());
  }

  /**
   * Issues a signed receipt for the given account.
   *
   * @param accountId - The authenticated account identifier.
   * @returns A signed {@link Receipt} with the computed expiry.
   * @throws {InvalidConfigurationError} When `tokenLifespanMinutes` is not positive.
   */
  public async execute(accountId: AccountId): Promise<Receipt> {
    if (this.tokenLifespanMinutes <= 0) {
      throw new InvalidConfigurationError(
        "Receipt token lifespan must be greater than zero minutes.",
      );
    }

    const now = this.now();
    const expiresAt = new Date(
      now.getTime() + this.tokenLifespanMinutes * 60 * 1000,
    );

    const signedToken = await this.signer.sign(accountId, expiresAt);

    return Receipt.issue({ token: signedToken, accountId, expiresAt, now });
  }
}
