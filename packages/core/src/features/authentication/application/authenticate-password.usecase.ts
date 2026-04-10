import { EmailAddress, LoggerPort } from "../../../shared/index.js";
import { AuthenticationError } from "../../../shared/domain/errors/auth.error.js";
import {
  PasswordCredentialStore,
  PasswordManager,
} from "../../credentials/index.js";
import type { Receipt } from "../../receipts/index.js";
import type { IssueReceiptUseCase } from "../../receipts/application/issue-receipt.usecase.js";

/**
 * Dependencies for {@link AuthenticateWithPasswordUseCase}.
 * @public
 */
export interface AuthenticateWithPasswordDeps {
  /** Persistence port for password credentials. */
  passwordStore: PasswordCredentialStore;
  /** Use-case that mints a signed receipt on success. */
  issueReceipt: Pick<IssueReceiptUseCase, "execute">;
  /** Structured logger. */
  logger: LoggerPort;
  /** Password hashing and comparison port. */
  passwordManager: PasswordManager;
}

/**
 * Input for {@link AuthenticateWithPasswordUseCase.execute}.
 * @public
 */
export interface AuthenticateWithPasswordInput {
  /** Raw email address string. */
  email: string;
  /** Plain-text password supplied by the client. */
  password: string;
}

/**
 * Authenticates a user with their email address and password.
 *
 * Both a missing account and a wrong password produce the same
 * {@link AuthenticationError} to prevent user enumeration.
 *
 * @public
 */
export class AuthenticateWithPasswordUseCase {
  private readonly deps: AuthenticateWithPasswordDeps;

  constructor(deps: AuthenticateWithPasswordDeps) {
    this.deps = deps;
  }

  /**
   * Validates the supplied credentials and returns a signed receipt.
   *
   * @param input - {@link AuthenticateWithPasswordInput}
   * @returns A signed {@link Receipt} for the authenticated account.
   * @throws {InvalidEmailError} When the email address is malformed.
   * @throws {AuthenticationError} When the email is not found or the password is wrong.
   */
  async execute(input: AuthenticateWithPasswordInput): Promise<Receipt> {
    const email = new EmailAddress(input.email);

    const credential = await this.deps.passwordStore.findByEmail(email);
    if (!credential) {
      this.deps.logger.warn("Authentication failed: email not found");
      throw new AuthenticationError();
    }

    const isValid = await this.deps.passwordManager.compare(
      input.password,
      credential.passwordHash,
    );
    if (!isValid) {
      this.deps.logger.warn("Authentication failed: wrong password");
      throw new AuthenticationError();
    }

    return await this.deps.issueReceipt.execute(credential.accountId);
  }
}
