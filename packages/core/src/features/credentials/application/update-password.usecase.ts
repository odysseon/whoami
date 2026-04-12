import type { LoggerPort } from "../../../shared/domain/ports/logger.port.js";
import type { PasswordCredentialStore } from "../domain/ports/password-credential-store.port.js";
import type { PasswordManager } from "../domain/ports/password-manager.port.js";
import { VerifyReceiptUseCase } from "../../receipts/application/verify-receipt.usecase.js";
import { AuthenticationError } from "../../../shared/domain/errors/auth.error.js";

/**
 * Input for {@link UpdatePasswordUseCase.execute}.
 * @public
 */
export interface UpdatePasswordInput {
  /** The authenticated user's current receipt token. */
  receiptToken: string;
  /** The user's current plain‑text password (for verification). */
  currentPassword: string;
  /** The new plain‑text password to set. */
  newPassword: string;
}

/**
 * Dependencies for {@link UpdatePasswordUseCase}.
 * @public
 */
export interface UpdatePasswordDeps {
  /** Finds password credentials by account ID. */
  credentialFinder: Pick<PasswordCredentialStore, "findByAccountId">;
  /** Updates existing password credential hashes. */
  credentialUpdater: Pick<PasswordCredentialStore, "update">;
  /** Hashes new passwords for storage. */
  passwordHasher: Pick<PasswordManager, "hash">;
  /** Verifies current passwords against stored hashes. */
  passwordVerifier: Pick<PasswordManager, "compare">;
  /**
   * Receipt verifier — either a {@link VerifyReceiptUseCase} instance or any
   * object with a compatible `execute(token)` signature.
   */
  receiptVerifier: Pick<VerifyReceiptUseCase, "execute">;
  logger: LoggerPort;
}

/**
 * Updates an existing account's password.
 *
 * Security requirements:
 * - The caller must supply a valid receipt token (already authenticated).
 * - The current password must be provided and verified.
 * - The account must already have a password credential.
 *
 * @public
 */
export class UpdatePasswordUseCase {
  private readonly credentialFinder: Pick<
    PasswordCredentialStore,
    "findByAccountId"
  >;
  private readonly credentialUpdater: Pick<PasswordCredentialStore, "update">;
  private readonly passwordHasher: Pick<PasswordManager, "hash">;
  private readonly passwordVerifier: Pick<PasswordManager, "compare">;
  private readonly receiptVerifier: Pick<VerifyReceiptUseCase, "execute">;
  private readonly logger: LoggerPort;

  constructor(deps: UpdatePasswordDeps) {
    this.credentialFinder = deps.credentialFinder;
    this.credentialUpdater = deps.credentialUpdater;
    this.passwordHasher = deps.passwordHasher;
    this.passwordVerifier = deps.passwordVerifier;
    this.receiptVerifier = deps.receiptVerifier;
    this.logger = deps.logger;
  }

  /**
   * Changes the user's password.
   *
   * @param input - {@link UpdatePasswordInput}
   * @throws {InvalidReceiptError} When the receipt token is invalid or expired.
   * @throws {AuthenticationError} When the account is not found, no password
   *         credential exists, or the current password is incorrect.
   */
  public async execute(input: UpdatePasswordInput): Promise<void> {
    // PHASE 1: verify the caller is authenticated
    const receipt = await this.receiptVerifier.execute(input.receiptToken);
    const authenticatedAccountId = receipt.accountId;

    // PHASE 2: load the existing password credential
    const existingCredential = await this.credentialFinder.findByAccountId(
      authenticatedAccountId,
    );

    if (!existingCredential) {
      this.logger.error(
        `Account ${authenticatedAccountId.value} has no password credential to update`,
      );
      throw new AuthenticationError(
        "No password credential found for this account.",
      );
    }

    // PHASE 3: verify current password
    const isCurrentPasswordValid = await this.passwordVerifier.compare(
      input.currentPassword,
      existingCredential.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      this.logger.warn(
        `Failed password update attempt: incorrect current password for account ${authenticatedAccountId.value}`,
      );
      throw new AuthenticationError("Current password is incorrect.");
    }

    // PHASE 4: hash the new password and update the credential
    const newHash = await this.passwordHasher.hash(input.newPassword);

    await this.credentialUpdater.update(existingCredential.id, newHash);

    this.logger.info(
      `Password updated successfully for account ${authenticatedAccountId.value}`,
    );
  }
}
