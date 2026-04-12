import { Credential } from "../../../kernel/credential/credential.entity.js";
import {
  AuthenticationError,
  CredentialId,
  EmailAddress,
} from "../../../kernel/shared/index.js";
import type { LoggerPort } from "../../../kernel/shared/ports/logger.port.js";
import type { IdGeneratorPort } from "../../../kernel/shared/ports/id-generator.port.js";
import type { AccountRepository } from "../../../kernel/account/account.repository.port.js";
import type { VerifyReceiptUseCase } from "../../../kernel/receipt/usecases/verify-receipt.usecase.js";
import type { OAuthCredentialStore } from "../ports/oauth-credential.store.port.js";

export interface LinkOAuthToAccountDeps {
  accountFinder: Pick<AccountRepository, "findById">;
  credentialFinder: Pick<OAuthCredentialStore, "findByProvider">;
  credentialSaver: Pick<OAuthCredentialStore, "save">;
  receiptVerifier: Pick<VerifyReceiptUseCase, "execute">;
  idGenerator: IdGeneratorPort;
  logger: LoggerPort;
}

export interface LinkOAuthToAccountInput {
  receiptToken: string;
  provider: string;
  providerId: string;
  email: string;
}

export class LinkOAuthToAccountUseCase {
  private readonly deps: LinkOAuthToAccountDeps;

  constructor(deps: LinkOAuthToAccountDeps) {
    this.deps = deps;
  }

  async execute(input: LinkOAuthToAccountInput): Promise<void> {
    const receipt = await this.deps.receiptVerifier.execute(input.receiptToken);
    const accountId = receipt.accountId;

    const account = await this.deps.accountFinder.findById(accountId);
    if (!account) {
      this.deps.logger.error(
        `Account ${accountId.value} not found despite valid receipt`,
      );
      throw new AuthenticationError("Account not found.");
    }

    const oauthEmail = new EmailAddress(input.email);
    if (!account.email.equals(oauthEmail)) {
      this.deps.logger.warn(
        `Email mismatch: account=${account.email.value} oauth=${input.email}`,
      );
      throw new AuthenticationError(
        "The OAuth account email does not match your account email.",
      );
    }

    const existing = await this.deps.credentialFinder.findByProvider(
      input.provider,
      input.providerId,
    );
    if (existing) {
      if (existing.accountId.equals(account.id)) {
        this.deps.logger.info(
          `OAuth already linked: account=${account.id.value}`,
        );
        return;
      }
      this.deps.logger.error(
        `OAuth credential already linked to different account ${existing.accountId.value}`,
      );
      throw new AuthenticationError(
        "This OAuth account is already linked to another user.",
      );
    }

    const credential = Credential.createOAuth({
      id: new CredentialId(this.deps.idGenerator()),
      accountId: account.id,
      provider: input.provider,
      providerId: input.providerId,
    });

    await this.deps.credentialSaver.save(credential);
    this.deps.logger.info(
      `Linked ${input.provider} to account ${account.id.value}`,
    );
  }
}
