import {
  AuthenticationError,
  EmailAddress,
} from "../../../kernel/shared/index.js";
import type { LoggerPort } from "../../../kernel/shared/ports/logger.port.js";
import type { AccountRepository } from "../../../kernel/account/account.repository.port.js";
import type { Receipt } from "../../../kernel/receipt/receipt.entity.js";
import type { IssueReceiptUseCase } from "../../../kernel/receipt/usecases/issue-receipt.usecase.js";
import type { PasswordCredentialStore } from "../ports/password-credential.store.port.js";
import type { PasswordHasher } from "../ports/password-hasher.port.js";
import { PasswordCredential } from "../domain/password-credential.entity.js";

export interface AuthenticateWithPasswordDeps {
  accountFinder: Pick<AccountRepository, "findByEmail">;
  credentialFinder: Pick<PasswordCredentialStore, "findByAccountId">;
  receiptIssuer: Pick<IssueReceiptUseCase, "execute">;
  passwordVerifier: Pick<PasswordHasher, "compare">;
  logger: LoggerPort;
}

export interface AuthenticateWithPasswordInput {
  email: string;
  password: string;
}

export class AuthenticateWithPasswordUseCase {
  private readonly deps: AuthenticateWithPasswordDeps;

  constructor(deps: AuthenticateWithPasswordDeps) {
    this.deps = deps;
  }

  async execute(input: AuthenticateWithPasswordInput): Promise<Receipt> {
    const email = new EmailAddress(input.email);
    const account = await this.deps.accountFinder.findByEmail(email);
    if (!account) {
      this.deps.logger.warn("Authentication failed: email not found");
      throw new AuthenticationError();
    }

    const raw = await this.deps.credentialFinder.findByAccountId(account.id);
    if (!raw) {
      this.deps.logger.warn("Authentication failed: no password credential");
      throw new AuthenticationError();
    }

    const credential = PasswordCredential.fromKernel(raw);
    const isValid = await this.deps.passwordVerifier.compare(
      input.password,
      credential.hash,
    );
    if (!isValid) {
      this.deps.logger.warn("Authentication failed: wrong password");
      throw new AuthenticationError();
    }

    return await this.deps.receiptIssuer.execute(credential.accountId);
  }
}
