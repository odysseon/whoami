import type { Receipt } from "../../../kernel/domain/entities/index.js";
import type { AccountId } from "../../../kernel/domain/value-objects/index.js";
import { InvalidMagicLinkError } from "../../../kernel/domain/errors/index.js";
import type { ReceiptSigner } from "../../../kernel/ports/index.js";
import type { MagicLinkCredentialStore } from "../ports/magiclink-credential-store.port.js";
import {
  isMagicLinkProof,
  markMagicLinkAsUsed,
} from "../entities/magiclink.proof.js";

/**
 * Input for authenticating with MagicLink
 */
export interface AuthenticateWithMagicLinkInput {
  readonly token: string;
}

/**
 * Output from authenticating with MagicLink
 */
export interface AuthenticateWithMagicLinkOutput {
  readonly receipt: Receipt;
  readonly accountId: AccountId;
  readonly email: string;
}

/**
 * Configuration for MagicLink authentication
 */
export interface AuthenticateWithMagicLinkConfig {
  readonly receiptLifespanMinutes: number;
}

/**
 * Use case for authenticating with a MagicLink token.
 * Verifies the token and issues a receipt for session management.
 */
export class AuthenticateWithMagicLinkUseCase {
  readonly #magicLinkStore: MagicLinkCredentialStore;
  readonly #receiptSigner: ReceiptSigner;
  readonly #config: AuthenticateWithMagicLinkConfig;

  constructor(deps: {
    magicLinkStore: MagicLinkCredentialStore;
    receiptSigner: ReceiptSigner;
    config: AuthenticateWithMagicLinkConfig;
  }) {
    this.#magicLinkStore = deps.magicLinkStore;
    this.#receiptSigner = deps.receiptSigner;
    this.#config = deps.config;
  }

  /**
   * Executes the authenticate with MagicLink use case
   * @param input - The input containing the token
   * @returns A receipt and account info
   * @throws InvalidMagicLinkError if the token is invalid, expired, or already used
   */
  async execute(
    input: AuthenticateWithMagicLinkInput,
  ): Promise<AuthenticateWithMagicLinkOutput> {
    // Hash the provided token to look it up
    const tokenHash = await this.#hashToken(input.token);

    // Find the MagicLink credential by token hash
    const credential = await this.#magicLinkStore.findByTokenHash(tokenHash);
    if (!credential) {
      throw new InvalidMagicLinkError("Invalid magic link");
    }

    // Verify it's a MagicLink proof
    const proof = credential.proof;
    if (!isMagicLinkProof(proof)) {
      throw new InvalidMagicLinkError("Invalid token type");
    }

    // Check if already used
    if (proof.usedAt) {
      throw new InvalidMagicLinkError("Magic link has already been used");
    }

    // Check if expired
    const now = new Date();
    if (now >= proof.expiresAt) {
      throw new InvalidMagicLinkError("Magic link has expired");
    }

    // Mark as used
    const updatedProof = markMagicLinkAsUsed(proof, now);
    await this.#magicLinkStore.update(credential.id, updatedProof);

    // Issue a receipt for session management
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
      email: proof.email,
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
