import { AccountId, InvalidConfigurationError } from "../../shared/index.js";
import type { ClockPort } from "../../shared/ports/clock.port.js";
import { Receipt } from "../receipt.entity.js";
import type { ReceiptSigner } from "../ports/receipt-signer.port.js";

export interface IssueReceiptDeps {
  signer: ReceiptSigner;
  tokenLifespanMinutes?: number;
  clock?: ClockPort;
}

/**
 * Issues a signed {@link Receipt} for a successfully authenticated account.
 * Clock and token lifespan are injected for deterministic testing.
 * @public
 */
export class IssueReceiptUseCase {
  private readonly signer: ReceiptSigner;
  private readonly tokenLifespanMinutes: number;
  private readonly clock: ClockPort;

  constructor(deps: IssueReceiptDeps) {
    this.signer = deps.signer;
    this.clock = deps.clock ?? ((): Date => new Date());

    const minutes = deps.tokenLifespanMinutes;
    if (minutes !== undefined) {
      if (
        !Number.isFinite(minutes) ||
        !Number.isInteger(minutes) ||
        minutes <= 0
      ) {
        throw new InvalidConfigurationError(
          "tokenLifespanMinutes must be a finite, positive integer.",
        );
      }
      this.tokenLifespanMinutes = minutes;
    } else {
      this.tokenLifespanMinutes = 60;
    }
  }

  public async execute(accountId: AccountId): Promise<Receipt> {
    const now = this.clock();
    const expiresAt = new Date(
      now.getTime() + this.tokenLifespanMinutes * 60 * 1000,
    );
    const signedToken = await this.signer.sign(accountId, expiresAt);
    return Receipt.issue({ token: signedToken, accountId, expiresAt, now });
  }
}
