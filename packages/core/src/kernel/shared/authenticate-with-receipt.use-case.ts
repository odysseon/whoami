import type { AccountId } from "../domain/value-objects/index.js";
import type { ReceiptVerifier } from "../ports/receipt-signer.port.js";
import type { AccountQueryPort } from "../ports/account-query.port.js";
import { AuthenticationError } from "../domain/errors/index.js";

/**
 * Safe, minimal identity attached to a request after authentication.
 * Intentionally excludes email and any other user data —
 * it answers only: "who is this, and until when is their token valid?"
 */
export interface AuthenticatedIdentity {
  readonly accountId: AccountId;
  readonly expiresAt: Date;
}

export interface AuthenticateWithReceiptDeps {
  readonly receiptVerifier: ReceiptVerifier;
  readonly accountQuery: AccountQueryPort;
}

/**
 * Inbound authentication use case — the complement to all outbound
 * authenticate* use cases that produce receipts.
 *
 * Composes two concerns that must not bleed into each other:
 *   1. Cryptographic verification (ReceiptVerifier)
 *   2. Account existence enforcement (AccountQueryPort)
 *
 * Adapters (NestJS guard, Express middleware) call this instead of
 * raw ReceiptVerifier.verify() so they stay thin and policy-free.
 */
export class AuthenticateWithReceiptUseCase {
  readonly #deps: AuthenticateWithReceiptDeps;

  constructor(deps: AuthenticateWithReceiptDeps) {
    this.#deps = deps;
  }

  async execute(token: string): Promise<AuthenticatedIdentity> {
    // Step 1: verify cryptographic integrity
    // Throws InvalidReceiptError (→ 401) if expired or tampered
    const receipt = await this.#deps.receiptVerifier.verify(token);

    // Step 2: assert the account still exists
    // A valid token can outlive its account (e.g. account deleted post-login)
    const account = await this.#deps.accountQuery.findById(receipt.accountId);
    if (!account) {
      throw new AuthenticationError("Account no longer exists");
    }

    return {
      accountId: account.id,
      expiresAt: receipt.expiresAt,
    };
  }
}
