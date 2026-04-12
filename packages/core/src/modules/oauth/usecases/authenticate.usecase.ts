import { Account } from "../../../kernel/account/account.entity.js";
import { Credential } from "../../../kernel/credential/credential.entity.js";
import {
  AccountId,
  AuthenticationError,
  CredentialId,
  EmailAddress,
} from "../../../kernel/shared/index.js";
import type { LoggerPort } from "../../../kernel/shared/ports/logger.port.js";
import type { IdGeneratorPort } from "../../../kernel/shared/ports/id-generator.port.js";
import type { AccountRepository } from "../../../kernel/account/account.repository.port.js";
import type { Receipt } from "../../../kernel/receipt/receipt.entity.js";
import type { IssueReceiptUseCase } from "../../../kernel/receipt/usecases/issue-receipt.usecase.js";
import type { OAuthCredentialStore } from "../ports/oauth-credential.store.port.js";

export interface AuthenticateWithOAuthDeps {
  accountFinder: Pick<AccountRepository, "findByEmail">;
  accountSaver: Pick<AccountRepository, "save">;
  accountRemover: Pick<AccountRepository, "delete">;
  credentialFinder: Pick<OAuthCredentialStore, "findByProvider">;
  credentialSaver: Pick<OAuthCredentialStore, "save">;
  receiptIssuer: Pick<IssueReceiptUseCase, "execute">;
  idGenerator: IdGeneratorPort;
  logger: LoggerPort;
}

export interface AuthenticateWithOAuthInput {
  provider: string;
  providerId: string;
  email: string;
}

export class AuthenticateWithOAuthUseCase {
  private readonly deps: AuthenticateWithOAuthDeps;

  constructor(deps: AuthenticateWithOAuthDeps) {
    this.deps = deps;
  }

  async execute(input: AuthenticateWithOAuthInput): Promise<Receipt> {
    const email = new EmailAddress(input.email);

    const existing = await this.deps.credentialFinder.findByProvider(
      input.provider,
      input.providerId,
    );
    if (existing) {
      this.deps.logger.info(
        `OAuth fast-path: provider=${input.provider} accountId=${existing.accountId.value}`,
      );
      return await this.deps.receiptIssuer.execute(existing.accountId);
    }

    const existingAccount = await this.deps.accountFinder.findByEmail(email);
    if (existingAccount) {
      this.deps.logger.warn(
        `OAuth conflict: account ${existingAccount.id.value} exists without ${input.provider} credential`,
      );
      throw new AuthenticationError(
        "An account already exists with this email. Log in with your password and link OAuth in settings.",
      );
    }

    this.deps.logger.info(`OAuth auto-registration: ${email.value}`);
    const account = Account.create(
      new AccountId(this.deps.idGenerator()),
      email,
    );
    await this.deps.accountSaver.save(account);

    const credential = Credential.createOAuth({
      id: new CredentialId(this.deps.idGenerator()),
      accountId: account.id,
      provider: input.provider,
      providerId: input.providerId,
    });

    try {
      await this.deps.credentialSaver.save(credential);
    } catch (err) {
      await this.deps.accountRemover.delete(account.id);
      throw err;
    }

    return await this.deps.receiptIssuer.execute(account.id);
  }
}
