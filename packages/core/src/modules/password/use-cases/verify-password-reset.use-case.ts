import type { Receipt } from "../../../kernel/domain/entities/index.js";
import type { AccountId } from "../../../kernel/domain/value-objects/index.js";
import { InvalidResetTokenError } from "../../../kernel/domain/errors/index.js";
import type { ReceiptSigner } from "../../../kernel/ports/index.js";
import type { PasswordCredentialStore } from "../ports/password-credential-store.port.js";
import {
  isPasswordResetProof,
  markResetProofAsUsed,
} from "../entities/password.proof.js";

/**
 * Input for verifying password reset
 */
export interface VerifyPasswordResetInput {
  readonly token: string;
}

/**
 * Output from verifying password reset
 */
export interface VerifyPasswordResetOutput {
  readonly receipt: Receipt;
  readonly accountId: AccountId;
}

/**
 * Configuration for password reset verification
 */
export interface VerifyPasswordResetConfig {
  readonly receiptLifespanMinutes: number;
}

/**
 * Use case for verifying a password reset token.
 * Exchanges the token for a receipt that can be used to change the password.
 */
export class VerifyPasswordResetUseCase {
  readonly #passwordStore: PasswordCredentialStore;
  readonly #receiptSigner: ReceiptSigner;
  readonly #config: VerifyPasswordResetConfig;

  constructor(deps: {
    passwordStore: PasswordCredentialStore;
    receiptSigner: ReceiptSigner;
    config: VerifyPasswordResetConfig;
  }) {
    this.#passwordStore = deps.passwordStore;
    this.#receiptSigner = deps.receiptSigner;
    this.#config = deps.config;
  }

  /**
   * Executes the verify password reset use case
   * @param input - The input containing the token
   * @returns A receipt that can be used to change the password
   * @throws InvalidResetTokenError if the token is invalid, expired, or already used
   */
  async execute(
    input: VerifyPasswordResetInput,
  ): Promise<VerifyPasswordResetOutput> {
    // Hash the provided token to look it up
    const tokenHash = await this.#hashToken(input.token);

    // Find the reset credential by token hash
    const credential = await this.#passwordStore.findByTokenHash(tokenHash);
    if (!credential) {
      throw new InvalidResetTokenError("Invalid reset token");
    }

    // Verify it's a reset proof
    const proof = credential.proof;
    if (!isPasswordResetProof(proof)) {
      throw new InvalidResetTokenError("Invalid token type");
    }

    // Check if already used
    if (proof.usedAt) {
      throw new InvalidResetTokenError("Token has already been used");
    }

    // Check if expired
    const now = new Date();
    if (now >= proof.expiresAt) {
      throw new InvalidResetTokenError("Token has expired");
    }

    // Mark as used
    const updatedProof = markResetProofAsUsed(proof, now);
    await this.#passwordStore.update(credential.id, updatedProof);

    // Issue a short-lived receipt for password change
    const expiresAt = new Date(
      now.getTime() + this.#config.receiptLifespanMinutes * 60 * 1000,
    );
    const receipt = await this.#receiptSigner.sign(
      credential.accountId,
      expiresAt,
    );

    return {
      receipt,
      accountId: credential.accountId,
    };
  }

  /**
   * Hashes a token using SHA-256
   */
  async #hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return this.#bufferToBase64Url(new Uint8Array(hashBuffer));
  }

  /**
   * Converts a Uint8Array to base64url string
   */
  #bufferToBase64Url(buffer: Uint8Array): string {
    const bytes = Array.from(buffer);
    const binary = bytes.map((b) => String.fromCharCode(b)).join("");
    const base64 = btoa(binary);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }
}
