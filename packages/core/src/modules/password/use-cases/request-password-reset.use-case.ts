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
  SecureTokenPort,
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
  readonly #secureToken: SecureTokenPort;
  readonly #config: PasswordResetConfig;

  constructor(deps: {
    accountRepo: AccountRepository;
    passwordStore: PasswordCredentialStore;
    idGenerator: IdGeneratorPort;
    logger: LoggerPort;
    clock: ClockPort;
    secureToken: SecureTokenPort;
    config: PasswordResetConfig;
  }) {
    this.#accountRepo = deps.accountRepo;
    this.#passwordStore = deps.passwordStore;
    this.#idGenerator = deps.idGenerator;
    this.#logger = deps.logger;
    this.#clock = deps.clock;
    this.#secureToken = deps.secureToken;
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
    const plainTextToken = this.#secureToken.generateToken();

    // Hash the token with SHA-256 for storage
    const tokenHash = await this.#secureToken.hashToken(plainTextToken);

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
}
