import { InvalidConfigurationError } from "../../../shared/domain/errors/validation.error.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { Receipt } from "../domain/receipt.entity.js";
import type { ReceiptSigner } from "../domain/ports/receipt-signer.port.js";

/**
 * Configuration for {@link IssueReceiptUseCase}.
 */
export interface IssueReceiptConfig {
  /**
   * The receipt signer implementation.
   */
  signer: ReceiptSigner;

  /**
   * How long the receipt remains valid, in minutes. Defaults to `60`.
   */
  tokenLifespanMinutes?: number;

  /**
   * Clock injection — returns the current time. Defaults to `() => new Date()`.
   * Override in tests to produce deterministic output.
   */
  now?: () => Date;
}

/**
 * Issues a signed receipt token for an authenticated account.
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
   * Issues a signed receipt using a single computed expiry value.
   *
   * @param accountId - The authenticated account identifier.
   * @returns The signed receipt token and expiry metadata.
   * @throws {InvalidConfigurationError} When the configured lifespan is not positive.
   */
  public async execute(accountId: AccountId): Promise<Receipt> {
    if (this.tokenLifespanMinutes <= 0) {
      throw new InvalidConfigurationError(
        "Receipt token lifespan must be greater than zero minutes.",
      );
    }

    const now = this.now();
    const expiresAt = new Date(now.getTime());
    expiresAt.setMinutes(expiresAt.getMinutes() + this.tokenLifespanMinutes);

    const signedToken = await this.signer.sign(accountId, expiresAt);

    return Receipt.issue({ token: signedToken, accountId, expiresAt, now });
  }
}
