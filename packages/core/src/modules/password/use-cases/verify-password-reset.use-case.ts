import { InvalidResetTokenError } from "../../../kernel/domain/errors/index.js";
import {
  isPasswordResetProof,
  markResetProofAsUsed,
} from "../entities/password.proof.js";
import type {
  VerifyPasswordResetInput,
  VerifyPasswordResetOutput,
  VerifyPasswordResetDeps,
} from "../password.config.js";

export class VerifyPasswordResetUseCase {
  readonly #deps: VerifyPasswordResetDeps;

  constructor(deps: VerifyPasswordResetDeps) {
    this.#deps = deps;
  }

  async execute(
    input: VerifyPasswordResetInput,
  ): Promise<VerifyPasswordResetOutput> {
    const tokenHash = await this.#deps.secureToken.hashToken(input.token);

    const credential =
      await this.#deps.resetTokenStore.findByTokenHash(tokenHash);
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
    await this.#deps.resetTokenStore.update(credential.id, updatedProof);

    const expiresAt = new Date(
      now.getTime() + this.#deps.config.receiptLifespanMinutes * 60 * 1000,
    );
    const receipt = await this.#deps.receiptSigner.sign(
      credential.accountId,
      expiresAt,
    );

    return { receipt: receipt.toDTO(), accountId: credential.accountId };
  }
}
