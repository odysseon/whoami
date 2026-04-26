import type { Receipt } from "../../../kernel/domain/entities/index.js";
import type { AccountId } from "../../../kernel/domain/value-objects/index.js";
import { InvalidResetTokenError } from "../../../kernel/domain/errors/index.js";
import type {
  ReceiptSigner,
  SecureTokenPort,
} from "../../../kernel/ports/index.js";
import type { PasswordResetTokenStore } from "../ports/password-reset-token-store.port.js";
import {
  isPasswordResetProof,
  markResetProofAsUsed,
} from "../entities/password.proof.js";

export interface VerifyPasswordResetInput {
  readonly token: string;
}

export interface VerifyPasswordResetOutput {
  readonly receipt: Receipt;
  readonly accountId: AccountId;
}

export interface VerifyPasswordResetConfig {
  readonly receiptLifespanMinutes: number;
}

/**
 * Use case for verifying a password reset token.
 * Exchanges a valid, unexpired, unused token for a short-lived receipt
 * that authorises a single password change.
 */
export class VerifyPasswordResetUseCase {
  readonly #resetTokenStore: PasswordResetTokenStore;
  readonly #receiptSigner: ReceiptSigner;
  readonly #secureToken: SecureTokenPort;
  readonly #config: VerifyPasswordResetConfig;

  constructor(deps: {
    resetTokenStore: PasswordResetTokenStore;
    receiptSigner: ReceiptSigner;
    secureToken: SecureTokenPort;
    config: VerifyPasswordResetConfig;
  }) {
    this.#resetTokenStore = deps.resetTokenStore;
    this.#receiptSigner = deps.receiptSigner;
    this.#secureToken = deps.secureToken;
    this.#config = deps.config;
  }

  async execute(
    input: VerifyPasswordResetInput,
  ): Promise<VerifyPasswordResetOutput> {
    const tokenHash = await this.#secureToken.hashToken(input.token);

    const credential = await this.#resetTokenStore.findByTokenHash(tokenHash);
    if (!credential) {
      throw new InvalidResetTokenError("Invalid reset token");
    }

    const proof = credential.proof;
    if (!isPasswordResetProof(proof)) {
      throw new InvalidResetTokenError("Invalid token type");
    }

    if (proof.usedAt) {
      throw new InvalidResetTokenError("Token has already been used");
    }

    const now = new Date();
    if (now >= proof.expiresAt) {
      throw new InvalidResetTokenError("Token has expired");
    }

    const updatedProof = markResetProofAsUsed(proof, now);
    await this.#resetTokenStore.update(credential.id, updatedProof);

    const expiresAt = new Date(
      now.getTime() + this.#config.receiptLifespanMinutes * 60 * 1000,
    );
    const receipt = await this.#receiptSigner.sign(
      credential.accountId,
      expiresAt,
    );

    return { receipt, accountId: credential.accountId };
  }
}
