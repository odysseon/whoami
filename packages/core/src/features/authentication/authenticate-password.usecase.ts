import { EmailAddress, LoggerPort } from "../../shared/index.js";
import {
  PasswordCredentialStore,
  PasswordManager,
} from "../credentials/index.js";
import { IssueReceiptUseCase, Receipt } from "../receipts/index.js";

export interface AuthenticateWithPasswordDeps {
  passwordStore: PasswordCredentialStore;
  issueReceipt: IssueReceiptUseCase;
  logger: LoggerPort;
  passwordManager: PasswordManager;
}

export interface AuthenticateWithPasswordInput {
  email: string;
  password: string;
}

/**
 * Orchestrates password-based authentication.
 */
export class AuthenticateWithPasswordUseCase {
  private readonly deps: AuthenticateWithPasswordDeps;

  constructor(deps: AuthenticateWithPasswordDeps) {
    this.deps = deps;
  }

  async execute(input: { email: string; password: string }): Promise<Receipt> {
    const credential = await this.deps.passwordStore.findByEmail(
      new EmailAddress(input.email),
    );

    if (!credential) {
      this.deps.logger.warn("Invalid credentials: email not found");
      throw new Error("Invalid credentials");
    }

    const isValid = await this.deps.passwordManager.compare(
      input.password,
      credential.passwordHash,
    );

    if (!isValid) {
      this.deps.logger.warn("Invalid credentials: wrong password");
      throw new Error("Invalid credentials");
    }

    return await this.deps.issueReceipt.execute(credential.accountId);
  }
}
