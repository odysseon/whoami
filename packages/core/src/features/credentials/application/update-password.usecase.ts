import type { LoggerPort } from "../../../shared/domain/ports/logger.port.js";
import type { PasswordCredentialStore } from "../domain/ports/password-credential-store.port.js";
import type { PasswordManager } from "../domain/ports/password-manager.port.js";
import type { VerifyReceiptUseCase } from "../../receipts/index.js";
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
  /** Persistence port for password credentials. */
  passwordStore: PasswordCredentialStore;
  /** Password hashing and comparison port. */
  passwordManager: PasswordManager;
  /** Use-case that verifies the caller's receipt token. */
  verifyReceipt: VerifyReceiptUseCase;
  /** Structured logger. */
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
  private readonly passwordStore: PasswordCredentialStore;
  private readonly passwordManager: PasswordManager;
  private readonly verifyReceipt: VerifyReceiptUseCase;
  private readonly logger: LoggerPort;

  constructor(deps: UpdatePasswordDeps) {
    this.passwordStore = deps.passwordStore;
    this.passwordManager = deps.passwordManager;
    this.verifyReceipt = deps.verifyReceipt;
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
    const receipt = await this.verifyReceipt.execute(input.receiptToken);
    const authenticatedAccountId = receipt.accountId;

    // PHASE 2: load the existing password credential
    const existingCredential = await this.passwordStore.findByAccountId(
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
    const isCurrentPasswordValid = await this.passwordManager.compare(
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
    const newHash = await this.passwordManager.hash(input.newPassword);

    await this.passwordStore.update(existingCredential.id, newHash);

    this.logger.info(
      `Password updated successfully for account ${authenticatedAccountId.value}`,
    );
  }
}
