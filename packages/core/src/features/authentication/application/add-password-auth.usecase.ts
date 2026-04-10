import { AccountId, CredentialId } from "../../../shared/index.js";
import {
  AccountNotFoundError,
  CredentialAlreadyExistsError,
} from "../../../shared/domain/errors/index.js";
import type { AuthMethod } from "../../../shared/domain/auth-method.js";
import { AccountRepository } from "../../accounts/index.js";
import {
  PasswordCredentialStore,
  PasswordManager,
  Credential,
} from "../../credentials/index.js";

/**
 * Dependencies for {@link AddPasswordAuthUseCase}.
 * @public
 */
export interface AddPasswordCredentialDeps {
  /** Persistence port for password credentials. */
  passwordStore: PasswordCredentialStore;
  /** Persistence port for account aggregates. */
  accountRepo: AccountRepository;
  /** Password hashing and comparison port. */
  hashManager: PasswordManager;
  /**
   * Deterministic ID generator — must return a non-empty string on every call.
   * Inject `crypto.randomUUID` or any UUID v4 factory.
   */
  generateId: () => string;
  /**
   * Returns the active authentication methods for the given account.
   * Used to enforce the "one password per account" invariant.
   */
  authMethods: (accountId: AccountId) => Promise<AuthMethod[]>;
}

/**
 * Input for {@link AddPasswordAuthUseCase.execute}.
 * @public
 */
export interface AddPasswordCredentialInput {
  /** The account to add a password credential to. */
  accountId: AccountId;
  /** Plain-text password; will be hashed before storage. */
  password: string;
}

/**
 * Adds password-based authentication to an existing account.
 *
 * Typically used when a user initially registered via OAuth and later
 * wants to add a password as an alternative login method.
 *
 * @public
 */
export class AddPasswordAuthUseCase {
  private readonly deps: AddPasswordCredentialDeps;

  constructor(deps: AddPasswordCredentialDeps) {
    this.deps = deps;
  }

  /**
   * Hashes the password and persists a new password credential for the account.
   *
   * @param input - {@link AddPasswordCredentialInput}
   * @throws {AccountNotFoundError} When no account exists for `input.accountId`.
   * @throws {CredentialAlreadyExistsError} When the account already has a password credential.
   */
  async execute(input: AddPasswordCredentialInput): Promise<void> {
    const account = await this.deps.accountRepo.findById(input.accountId);
    if (!account) {
      throw new AccountNotFoundError(input.accountId.value);
    }

    const existingMethods = await this.deps.authMethods(input.accountId);
    if (existingMethods.includes("password")) {
      throw new CredentialAlreadyExistsError();
    }

    const hash = await this.deps.hashManager.hash(input.password);

    const credential = Credential.createPassword({
      id: new CredentialId(this.deps.generateId()),
      accountId: account.id,
      hash,
    });

    await this.deps.passwordStore.save(credential);
  }
}
