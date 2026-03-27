import { InvalidConfigurationError } from "../../../shared/domain/errors/validation.error.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { Receipt } from "../domain/receipt.entity.js";
import type { ReceiptSigner } from "../domain/ports/receipt-signer.port.js";

/**
 * Issues a signed receipt token for an authenticated account.
 */
export class IssueReceiptUseCase {
  constructor(
    private readonly signer: ReceiptSigner,
    private readonly tokenLifespanMinutes: number = 60,
    private readonly now: () => Date = () => new Date(),
  ) {}

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

    const expiresAt = new Date(this.now().getTime());
    expiresAt.setMinutes(expiresAt.getMinutes() + this.tokenLifespanMinutes);

    const signedToken = await this.signer.sign(accountId, expiresAt);

    return Receipt.issue(signedToken, accountId, expiresAt);
  }
}
