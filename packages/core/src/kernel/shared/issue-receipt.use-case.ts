import type { AccountId } from "../domain/value-objects/index.js";
import type { ReceiptSigner } from "../ports/receipt-signer.port.js";
import type { Receipt } from "../domain/entities/receipt.js";

export interface IssueReceiptDeps {
  readonly receiptSigner: ReceiptSigner;
  readonly tokenLifespanMinutes: number;
}

/**
 * Encapsulates the single responsibility of issuing a signed receipt.
 * All authenticate* use cases delegate here so receipt-issuance policy
 * (lifespan, audit logging, rotation, etc.) lives in one place.
 */
export class IssueReceiptUseCase {
  readonly #deps: IssueReceiptDeps;

  constructor(deps: IssueReceiptDeps) {
    this.#deps = deps;
  }

  async execute(accountId: AccountId): Promise<Receipt> {
    const expiresAt = new Date(
      Date.now() + this.#deps.tokenLifespanMinutes * 60 * 1000,
    );
    return await this.#deps.receiptSigner.sign(accountId, expiresAt);
  }
}
