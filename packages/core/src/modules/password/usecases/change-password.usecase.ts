import { AuthenticationError } from "../../../kernel/shared/index.js";
import type { LoggerPort } from "../../../kernel/shared/ports/logger.port.js";
import type { PasswordCredentialStore } from "../ports/password-credential.store.port.js";
import type { PasswordHasher } from "../ports/password-hasher.port.js";
import type { VerifyReceiptUseCase } from "../../../kernel/receipt/usecases/verify-receipt.usecase.js";

export interface ChangePasswordDeps {
  credentialFinder: Pick<PasswordCredentialStore, "findByAccountId">;
  credentialUpdater: Pick<PasswordCredentialStore, "update">;
  passwordHasher: Pick<PasswordHasher, "hash" | "compare">;
  receiptVerifier: Pick<VerifyReceiptUseCase, "execute">;
  logger: LoggerPort;
}

export interface ChangePasswordInput {
  receiptToken: string;
  currentPassword: string;
  newPassword: string;
}

export class ChangePasswordUseCase {
  private readonly deps: ChangePasswordDeps;

  constructor(deps: ChangePasswordDeps) {
    this.deps = deps;
  }

  async execute(input: ChangePasswordInput): Promise<void> {
    const receipt = await this.deps.receiptVerifier.execute(input.receiptToken);
    const accountId = receipt.accountId;

    const credential =
      await this.deps.credentialFinder.findByAccountId(accountId);
    if (!credential) {
      this.deps.logger.error(
        `No password credential for account ${accountId.value}`,
      );
      throw new AuthenticationError(
        "No password credential found for this account.",
      );
    }

    const valid = await this.deps.passwordHasher.compare(
      input.currentPassword,
      credential.passwordHash,
    );
    if (!valid) {
      this.deps.logger.warn(
        `Incorrect current password for account ${accountId.value}`,
      );
      throw new AuthenticationError("Current password is incorrect.");
    }

    const newHash = await this.deps.passwordHasher.hash(input.newPassword);
    await this.deps.credentialUpdater.update(credential.id, newHash);
    this.deps.logger.info(`Password updated for account ${accountId.value}`);
  }
}
