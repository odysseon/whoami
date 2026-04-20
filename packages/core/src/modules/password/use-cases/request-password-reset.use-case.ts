import { Credential } from "../../../kernel/domain/entities/index.js";
import type {
  EmailAddress,
  CredentialId,
} from "../../../kernel/domain/value-objects/index.js";
import {
  createCredentialId,
  createEmailAddress,
} from "../../../kernel/domain/value-objects/index.js";
import { InvalidEmailError } from "../../../kernel/domain/errors/index.js";
import type { AccountRepository } from "../../../kernel/ports/account-repository.port.js";
import type {
  IdGeneratorPort,
  LoggerPort,
  ClockPort,
} from "../../../kernel/ports/index.js";
import type { PasswordCredentialStore } from "../ports/password-credential-store.port.js";
import { createPasswordResetProof } from "../entities/password.proof.js";

/**
 * Input for requesting password reset
 */
export interface RequestPasswordResetInput {
  readonly email: string;
}

/**
 * Output from requesting password reset
 */
export interface RequestPasswordResetOutput {
  readonly challengeId: CredentialId;
  readonly plainTextToken: string;
  readonly expiresAt: Date;
}

/**
 * Configuration for password reset
 */
export interface PasswordResetConfig {
  readonly tokenLifespanMinutes: number;
}

/**
 * Use case for requesting a password reset.
 * Generates a cryptographically secure token and returns it to the caller.
 * The caller MUST deliver this token via email/SMS.
 */
export class RequestPasswordResetUseCase {
  readonly #accountRepo: AccountRepository;
  readonly #passwordStore: PasswordCredentialStore;
  readonly #idGenerator: IdGeneratorPort;
  readonly #logger: LoggerPort;
  readonly #clock: ClockPort;
  readonly #config: PasswordResetConfig;

  constructor(deps: {
    accountRepo: AccountRepository;
    passwordStore: PasswordCredentialStore;
    idGenerator: IdGeneratorPort;
    logger: LoggerPort;
    clock: ClockPort;
    config: PasswordResetConfig;
  }) {
    this.#accountRepo = deps.accountRepo;
    this.#passwordStore = deps.passwordStore;
    this.#idGenerator = deps.idGenerator;
    this.#logger = deps.logger;
    this.#clock = deps.clock;
    this.#config = deps.config;
  }

  /**
   * Executes the request password reset use case
   * @param input - The input
   * @returns The challenge ID, plaintext token, and expiration time
   *
   * SECURITY NOTE: The plaintext token is returned ONCE to the caller.
   * The caller MUST deliver it via email/SMS. Only the hash is stored.
   */
  async execute(
    input: RequestPasswordResetInput,
  ): Promise<RequestPasswordResetOutput | null> {
    // Validate email
    let email: EmailAddress;
    try {
      email = createEmailAddress(input.email);
    } catch {
      throw new InvalidEmailError(`Invalid email: ${input.email}`);
    }

    // Find account - but don't reveal if it exists or not
    const account = await this.#accountRepo.findByEmail(email);
    if (!account) {
      // Log but don't reveal to caller (security through obscurity)
      this.#logger.warn("Password reset requested for non-existent account", {
        email: input.email,
      });
      // Return null to indicate no reset was created (but don't reveal why)
      return null;
    }

    // Generate cryptographically secure token
    const plainTextToken = this.#generateSecureToken();

    // Hash the token with SHA-256 for storage
    const tokenHash = await this.#hashToken(plainTextToken);

    // Calculate expiration
    const expiresAt = new Date(
      this.#clock.now().getTime() +
        this.#config.tokenLifespanMinutes * 60 * 1000,
    );

    // Create reset credential
    const challengeId = createCredentialId(this.#idGenerator.generate());
    const credential = Credential.create({
      id: challengeId,
      accountId: account.id,
      proof: createPasswordResetProof(tokenHash, expiresAt),
    });

    // Save credential
    await this.#passwordStore.save(credential);

    this.#logger.info("Password reset challenge created", {
      accountId: account.id.toString(),
      challengeId: challengeId.toString(),
      expiresAt: expiresAt.toISOString(),
    });

    return {
      challengeId,
      plainTextToken,
      expiresAt,
    };
  }

  /**
   * Generates a cryptographically secure random token
   * Uses Web Crypto API for security
   */
  #generateSecureToken(): string {
    // Generate 32 bytes of random data (256 bits of entropy)
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    // Convert to base64url encoding
    return this.#bufferToBase64Url(buffer);
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
