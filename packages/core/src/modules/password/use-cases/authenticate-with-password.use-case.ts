import type { EmailAddress } from "../../../kernel/domain/value-objects/index.js";
import { createEmailAddress } from "../../../kernel/domain/value-objects/index.js";
import {
  AuthenticationError,
  InvalidEmailError,
} from "../../../kernel/domain/errors/index.js";
import type { AccountRepository } from "../../../kernel/ports/account-repository.port.js";
import type { ReceiptSigner, LoggerPort } from "../../../kernel/ports/index.js";
import type { PasswordHashStore } from "../ports/password-hash-store.port.js";
import type { PasswordHasher } from "../ports/password-hasher.port.js";
import type {
  AuthenticateWithPasswordInput,
  AuthenticateWithPasswordOutput,
} from "../password.config.js";

/**
 * Use case for authenticating with password
 */
export class AuthenticateWithPasswordUseCase {
  readonly #accountRepo: AccountRepository;
  readonly #passwordStore: PasswordHashStore;
  readonly #passwordHasher: PasswordHasher;
  readonly #receiptSigner: ReceiptSigner;
  readonly #logger: LoggerPort;
  readonly #tokenLifespanMinutes: number;

  constructor(deps: {
    accountRepo: AccountRepository;
    passwordStore: PasswordHashStore;
    passwordHasher: PasswordHasher;
    receiptSigner: ReceiptSigner;
    logger: LoggerPort;
    tokenLifespanMinutes: number;
  }) {
    this.#accountRepo = deps.accountRepo;
    this.#passwordStore = deps.passwordStore;
    this.#passwordHasher = deps.passwordHasher;
    this.#receiptSigner = deps.receiptSigner;
    this.#logger = deps.logger;
    this.#tokenLifespanMinutes = deps.tokenLifespanMinutes;
  }

  async execute(
    input: AuthenticateWithPasswordInput,
  ): Promise<AuthenticateWithPasswordOutput> {
    let email: EmailAddress;
    try {
      email = createEmailAddress(input.email);
    } catch {
      throw new InvalidEmailError(`Invalid email: ${input.email}`);
    }

    const account = await this.#accountRepo.findByEmail(email);
    if (!account) {
      this.#logger.warn("Authentication attempt for non-existent account", {
        email: input.email,
      });
      throw new AuthenticationError("Invalid credentials");
    }

    const credential = await this.#passwordStore.findByAccountId(account.id);
    if (!credential) {
      this.#logger.warn("Authentication attempt for account without password", {
        accountId: account.id.toString(),
      });
      throw new AuthenticationError("Invalid credentials");
    }

    const proof = credential.proof;
    const isValid = await this.#passwordHasher.compare(
      input.password,
      proof.hash,
    );
    if (!isValid) {
      this.#logger.warn("Authentication attempt with wrong password", {
        accountId: account.id.toString(),
      });
      throw new AuthenticationError("Invalid credentials");
    }

    const expiresAt = new Date(
      Date.now() + this.#tokenLifespanMinutes * 60 * 1000,
    );
    const receipt = await this.#receiptSigner.sign(account.id, expiresAt);

    this.#logger.info("Account authenticated with password", {
      accountId: account.id.toString(),
    });

    return { receipt, account };
  }
}
