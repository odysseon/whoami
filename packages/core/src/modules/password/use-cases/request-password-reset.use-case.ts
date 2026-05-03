import { Credential } from "../../../kernel/domain/entities/index.js";
import type { EmailAddress } from "../../../kernel/domain/value-objects/index.js";
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
import type { PasswordResetTokenStore } from "../ports/password-reset-token-store.port.js";
import { createPasswordResetProof } from "../entities/password.proof.js";
import type {
  RequestPasswordResetInput,
  RequestPasswordResetOutput,
  PasswordResetConfig,
} from "../password.config.js";

/**
 * Use case for requesting a password reset
 */
export class RequestPasswordResetUseCase {
  readonly #accountRepo: AccountRepository;
  readonly #resetTokenStore: PasswordResetTokenStore;
  readonly #idGenerator: IdGeneratorPort;
  readonly #logger: LoggerPort;
  readonly #clock: ClockPort;
  readonly #secureToken: SecureTokenPort;
  readonly #config: PasswordResetConfig;

  constructor(deps: {
    accountRepo: AccountRepository;
    resetTokenStore: PasswordResetTokenStore;
    idGenerator: IdGeneratorPort;
    logger: LoggerPort;
    clock: ClockPort;
    secureToken: SecureTokenPort;
    config: PasswordResetConfig;
  }) {
    this.#accountRepo = deps.accountRepo;
    this.#resetTokenStore = deps.resetTokenStore;
    this.#idGenerator = deps.idGenerator;
    this.#logger = deps.logger;
    this.#clock = deps.clock;
    this.#secureToken = deps.secureToken;
    this.#config = deps.config;
  }

  async execute(
    input: RequestPasswordResetInput,
  ): Promise<RequestPasswordResetOutput | null> {
    let email: EmailAddress;
    try {
      email = createEmailAddress(input.email);
    } catch {
      throw new InvalidEmailError(`Invalid email: ${input.email}`);
    }

    const account = await this.#accountRepo.findByEmail(email);
    if (!account) {
      this.#logger.warn("Password reset requested for non-existent account", {
        email: input.email,
      });
      return null;
    }

    const plainTextToken = this.#secureToken.generateToken();
    const tokenHash = await this.#secureToken.hashToken(plainTextToken);
    const expiresAt = new Date(
      this.#clock.now().getTime() +
        this.#config.tokenLifespanMinutes * 60 * 1000,
    );

    const challengeId = createCredentialId(this.#idGenerator.generate());
    const credential = Credential.create({
      id: challengeId,
      accountId: account.id,
      proof: createPasswordResetProof(tokenHash, expiresAt),
    });

    await this.#resetTokenStore.save(credential);

    this.#logger.info("Password reset challenge created", {
      accountId: account.id.toString(),
      challengeId: challengeId.toString(),
      expiresAt: expiresAt.toISOString(),
    });

    return { challengeId, plainTextToken, expiresAt };
  }
}
