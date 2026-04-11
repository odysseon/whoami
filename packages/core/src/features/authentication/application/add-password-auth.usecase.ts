import { AccountId, CredentialId } from "../../../shared/index.js";
import {
  AccountNotFoundError,
  CredentialAlreadyExistsError,
} from "../../../shared/domain/errors/index.js";
import type { AuthMethodsProvider } from "../../../shared/domain/auth-method.js";
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
export interface AddPasswordAuthDeps {
  /** Finds accounts by ID. */
  accountFinder: Pick<AccountRepository, "findById">;
  /** Persists password credentials. */
  credentialSaver: Pick<PasswordCredentialStore, "save">;
  /** Hashes plain-text passwords for storage. */
  passwordHasher: Pick<PasswordManager, "hash">;
  /**
   * Deterministic ID generator — must return a non-empty string on every call.
   * Inject `crypto.randomUUID` or any UUID v4 factory.
   */
  idGenerator: () => string;
  /**
   * Returns the active authentication methods for the given account.
   * Used to enforce the "one password per account" invariant.
   */
  authMethodsProvider: AuthMethodsProvider;
}

/**
 * Input for {@link AddPasswordAuthUseCase.execute}.
 * @public
 */
export interface AddPasswordAuthInput {
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
  private readonly deps: AddPasswordAuthDeps;

  constructor(deps: AddPasswordAuthDeps) {
    this.deps = deps;
  }

  /**
   * Hashes the password and persists a new password credential for the account.
   *
   * @param input - {@link AddPasswordAuthInput}
   * @throws {AccountNotFoundError} When no account exists for `input.accountId`.
   * @throws {CredentialAlreadyExistsError} When the account already has a password credential.
   */
  async execute(input: AddPasswordAuthInput): Promise<void> {
    const account = await this.deps.accountFinder.findById(input.accountId);
    if (!account) {
      throw new AccountNotFoundError(input.accountId.value);
    }

    const existingMethods = await this.deps.authMethodsProvider(
      input.accountId,
    );
    if (existingMethods.includes("password")) {
      throw new CredentialAlreadyExistsError();
    }

    const hash = await this.deps.passwordHasher.hash(input.password);

    const credential = Credential.createPassword({
      id: new CredentialId(this.deps.idGenerator()),
      accountId: account.id,
      hash,
    });

    await this.deps.credentialSaver.save(credential);
  }
}
