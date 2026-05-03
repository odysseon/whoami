import { InvalidMagicLinkError } from "../../../kernel/domain/errors/index.js";
import {
  isMagicLinkProof,
  markMagicLinkAsUsed,
} from "../entities/magiclink.proof.js";
import type {
  AuthenticateWithMagicLinkInput,
  AuthenticateWithMagicLinkOutput,
  AuthenticateWithMagicLinkDeps,
} from "../magiclink.config.js";

export class AuthenticateWithMagicLinkUseCase {
  readonly #deps: AuthenticateWithMagicLinkDeps;

  constructor(deps: AuthenticateWithMagicLinkDeps) {
    this.#deps = deps;
  }

  async execute(
    input: AuthenticateWithMagicLinkInput,
  ): Promise<AuthenticateWithMagicLinkOutput> {
    const tokenHash = await this.#deps.secureToken.hashToken(input.token);

    const credential =
      await this.#deps.magicLinkStore.findByTokenHash(tokenHash);
    if (!credential) {
      throw new InvalidMagicLinkError("Invalid magic link");
    }

    const proof = credential.proof;
    if (!isMagicLinkProof(proof)) {
      throw new InvalidMagicLinkError("Invalid token type");
    }

    if (proof.usedAt) {
      throw new InvalidMagicLinkError("Magic link has already been used");
    }

    const now = new Date();
    if (now >= proof.expiresAt) {
      throw new InvalidMagicLinkError("Magic link has expired");
    }

    const updatedProof = markMagicLinkAsUsed(proof, now);
    await this.#deps.magicLinkStore.update(credential.id, updatedProof);

    const expiresAt = new Date(
      now.getTime() + this.#deps.config.receiptLifespanMinutes * 60 * 1000,
    );
    const receipt = await this.#deps.receiptSigner.sign(
      credential.accountId,
      expiresAt,
    );

    return {
      receipt: receipt.toDTO(),
      accountId: credential.accountId,
      email: proof.email,
    };
  }
}
