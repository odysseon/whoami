import { AuthenticationError, EmailAddress } from "../../shared/index.js";
import { VerifyPasswordUseCase } from "../credentials/application/verify-password.usecase.js";
import { PasswordCredentialStore } from "../credentials/index.js";
import { IssueReceiptUseCase } from "../receipts/index.js";
import { AuthResult } from "./types.js";

export interface AuthenticateWithPasswordDeps {
  passwordStore: PasswordCredentialStore;
  verifyPassword: VerifyPasswordUseCase;
  issueReceipt: IssueReceiptUseCase;
}

export interface AuthenticateWithPasswordInput {
  email: string;
  password: string;
}

/**
 * Orchestrates password-based authentication.
 */
export class AuthenticateWithPasswordUseCase {
  private readonly passwordStore: PasswordCredentialStore;
  private readonly verifyPassword: VerifyPasswordUseCase;
  private readonly issueReceipt: IssueReceiptUseCase;

  constructor(deps: AuthenticateWithPasswordDeps) {
    this.passwordStore = deps.passwordStore;
    this.verifyPassword = deps.verifyPassword;
    this.issueReceipt = deps.issueReceipt;
  }

  public async execute(
    input: AuthenticateWithPasswordInput,
  ): Promise<AuthResult> {
    const email = new EmailAddress(input.email);
    // --- Fetch credential once ---
    const credential = await this.passwordStore.findByEmail(email);

    if (!credential) {
      throw new AuthenticationError("Invalid credentials");
    }

    // --- Verify password using the fetched credential ---
    await this.verifyPassword.execute({
      credential,
      plainTextPassword: input.password,
    });

    // --- Issue token / receipt ---
    const receipt = await this.issueReceipt.execute(credential.accountId);

    return {
      accountId: credential.accountId,
      token: receipt.token,
    };
  }
}
