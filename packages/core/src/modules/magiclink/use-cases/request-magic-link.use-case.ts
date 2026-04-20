import { Credential } from "../../../kernel/domain/entities/index.js";
import type { EmailAddress } from "../../../kernel/domain/value-objects/index.js";
import {
  createAccountId,
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
import type { MagicLinkCredentialStore } from "../ports/magiclink-credential-store.port.js";
import { createMagicLinkProof } from "../entities/magiclink.proof.js";
import { Account } from "../../../kernel/domain/entities/account.js";

/**
 * Input for requesting a MagicLink
 */
export interface RequestMagicLinkInput {
  readonly email: string;
}

/**
 * Output from requesting a MagicLink
 */
export interface RequestMagicLinkOutput {
  readonly challengeId: ReturnType<typeof createCredentialId>;
  readonly plainTextToken: string;
  readonly expiresAt: Date;
  readonly isNewAccount: boolean;
}

/**
 * Configuration for MagicLink
 */
export interface MagicLinkConfig {
  readonly tokenLifespanMinutes: number;
}

/**
 * Use case for requesting a MagicLink.
 * Generates a cryptographically secure token and returns it to the caller.
 * The caller MUST deliver this token via email.
 */
export class RequestMagicLinkUseCase {
  readonly #accountRepo: AccountRepository;
  readonly #magicLinkStore: MagicLinkCredentialStore;
  readonly #idGenerator: IdGeneratorPort;
  readonly #logger: LoggerPort;
  readonly #clock: ClockPort;
  readonly #config: MagicLinkConfig;

  constructor(deps: {
    accountRepo: AccountRepository;
    magicLinkStore: MagicLinkCredentialStore;
    idGenerator: IdGeneratorPort;
    logger: LoggerPort;
    clock: ClockPort;
    config: MagicLinkConfig;
  }) {
    this.#accountRepo = deps.accountRepo;
    this.#magicLinkStore = deps.magicLinkStore;
    this.#idGenerator = deps.idGenerator;
    this.#logger = deps.logger;
    this.#clock = deps.clock;
    this.#config = deps.config;
  }

  /**
   * Executes the request MagicLink use case
   * @param input - The input
   * @returns The challenge ID, plaintext token, and expiration time
   *
   * SECURITY NOTE: The plaintext token is returned ONCE to the caller.
   * The caller MUST deliver it via email. Only the hash is stored.
   */
  async execute(input: RequestMagicLinkInput): Promise<RequestMagicLinkOutput> {
    // Validate email
    let email: EmailAddress;
    try {
      email = createEmailAddress(input.email);
    } catch {
      throw new InvalidEmailError(`Invalid email: ${input.email}`);
    }

    // Find or create account
    let account = await this.#accountRepo.findByEmail(email);
    let isNewAccount = false;

    if (!account) {
      // Auto-register new account
      const accountId = createAccountId(this.#idGenerator.generate());
      account = Account.create({
        id: accountId,
        email,
      });
      await this.#accountRepo.save(account);
      isNewAccount = true;

      this.#logger.info("MagicLink auto-registration", {
        accountId: accountId.toString(),
        email: input.email,
      });
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

    // Create MagicLink credential
    const challengeId = createCredentialId(this.#idGenerator.generate());
    const credential = Credential.create({
      id: challengeId,
      accountId: account.id,
      proof: createMagicLinkProof(tokenHash, email.toString(), expiresAt),
    });

    // Save credential
    await this.#magicLinkStore.save(credential);

    this.#logger.info("MagicLink challenge created", {
      accountId: account.id.toString(),
      challengeId: challengeId.toString(),
      expiresAt: expiresAt.toISOString(),
    });

    return {
      challengeId,
      plainTextToken,
      expiresAt,
      isNewAccount,
    };
  }

  /**
   * Generates a cryptographically secure random token
   */
  #generateSecureToken(): string {
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
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
