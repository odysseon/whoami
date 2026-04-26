import { Account, Credential } from "../../../kernel/domain/entities/index.js";
import type { EmailAddress } from "../../../kernel/domain/value-objects/index.js";
import {
  createAccountId,
  createCredentialId,
  createEmailAddress,
} from "../../../kernel/domain/value-objects/index.js";
import {
  AccountAlreadyExistsError,
  InvalidEmailError,
} from "../../../kernel/domain/errors/index.js";
import type { AccountRepository } from "../../../kernel/ports/account-repository.port.js";
import type {
  IdGeneratorPort,
  LoggerPort,
} from "../../../kernel/ports/shared-ports.port.js";
import type { PasswordHashStore } from "../ports/password-hash-store.port.js";
import type { PasswordHasher } from "../ports/password-hasher.port.js";
import { createPasswordHashProof } from "../entities/password.proof.js";

/**
 * Input for registering with password
 */
export interface RegisterWithPasswordInput {
  readonly email: string;
  readonly password: string;
}

/**
 * Output from registering with password
 */
export interface RegisterWithPasswordOutput {
  readonly account: Account;
}

/**
 * Use case for registering a new account with password
 */
export class RegisterWithPasswordUseCase {
  readonly #accountRepo: AccountRepository;
  readonly #passwordStore: PasswordHashStore;
  readonly #passwordHasher: PasswordHasher;
  readonly #idGenerator: IdGeneratorPort;
  readonly #logger: LoggerPort;

  constructor(deps: {
    accountRepo: AccountRepository;
    passwordStore: PasswordHashStore;
    passwordHasher: PasswordHasher;
    idGenerator: IdGeneratorPort;
    logger: LoggerPort;
  }) {
    this.#accountRepo = deps.accountRepo;
    this.#passwordStore = deps.passwordStore;
    this.#passwordHasher = deps.passwordHasher;
    this.#idGenerator = deps.idGenerator;
    this.#logger = deps.logger;
  }

  /**
   * Executes the register with password use case
   * @param input - The registration input
   * @returns The created account
   */
  async execute(
    input: RegisterWithPasswordInput,
  ): Promise<RegisterWithPasswordOutput> {
    // Validate email
    let email: EmailAddress;
    try {
      email = createEmailAddress(input.email);
    } catch {
      throw new InvalidEmailError(`Invalid email: ${input.email}`);
    }

    // Check if account already exists
    const existingAccount = await this.#accountRepo.findByEmail(email);
    if (existingAccount) {
      this.#logger.warn("Attempted to register with existing email", {
        email: input.email,
      });
      throw new AccountAlreadyExistsError(input.email);
    }

    // Create account
    const accountId = createAccountId(this.#idGenerator.generate());
    const account = Account.create({
      id: accountId,
      email,
    });

    // Hash password
    const passwordHash = await this.#passwordHasher.hash(input.password);

    // Create password credential
    const credentialId = createCredentialId(this.#idGenerator.generate());
    const credential = Credential.create({
      id: credentialId,
      accountId,
      proof: createPasswordHashProof(passwordHash),
    });

    // Save account and credential
    await this.#accountRepo.save(account);
    await this.#passwordStore.save(credential);

    this.#logger.info("Account registered with password", {
      accountId: accountId.toString(),
      email: input.email,
    });

    return { account };
  }
}
