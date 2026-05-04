import { Credential } from "../../../kernel/domain/entities/index.js";
import type {
  EmailAddress,
  AccountId,
} from "../../../kernel/domain/value-objects/index.js";
import {
  createAccountId,
  createCredentialId,
  createEmailAddress,
} from "../../../kernel/domain/value-objects/index.js";
import {
  AuthenticationError,
  InvalidEmailError,
} from "../../../kernel/domain/errors/index.js";
import type { Receipt } from "../../../kernel/domain/entities/index.js";
import { Account } from "../../../kernel/domain/entities/account.js";
import { createOAuthProof } from "../entities/oauth.proof.js";
import type {
  AuthenticateWithOAuthInput,
  AuthenticateWithOAuthOutput,
  AuthenticateWithOAuthDeps,
} from "../oauth.config.js";

export class AuthenticateWithOAuthUseCase {
  readonly #deps: AuthenticateWithOAuthDeps;

  constructor(deps: AuthenticateWithOAuthDeps) {
    this.#deps = deps;
  }

  async execute(
    input: AuthenticateWithOAuthInput,
  ): Promise<AuthenticateWithOAuthOutput> {
    let email: EmailAddress;
    try {
      email = createEmailAddress(input.email);
    } catch {
      throw new InvalidEmailError(`Invalid email: ${input.email}`);
    }

    const existing = await this.#deps.oauthStore.findByProvider(
      input.provider,
      input.providerId,
    );
    if (existing)
      return await this.#fastPath(existing.accountId, input.provider);

    const conflict = await this.#deps.accountRepo.findByEmail(email);
    if (conflict) {
      this.#deps.logger.warn(
        "OAuth conflict: account exists without OAuth link",
        { email: input.email, provider: input.provider },
      );
      throw new AuthenticationError(
        "An account already exists with this email. Please log in with your existing method and link this provider in settings.",
      );
    }

    return await this.#autoRegister(email, input.provider, input.providerId);
  }

  async #fastPath(
    accountId: AccountId,
    provider: string,
  ): Promise<AuthenticateWithOAuthOutput> {
    const account = await this.#deps.accountRepo.findById(accountId);
    if (!account) {
      this.#deps.logger.error("Orphaned OAuth credential", { provider });
      throw new AuthenticationError("Account not found");
    }
    const receipt = await this.#issueReceipt(accountId);
    this.#deps.logger.info("OAuth authentication (fast path)", {
      accountId: accountId.toString(),
      provider,
    });
    return {
      receipt: receipt.toDTO(),
      account: account.toDTO(),
      isNewAccount: false,
    };
  }

  async #autoRegister(
    email: EmailAddress,
    provider: string,
    providerId: string,
  ): Promise<AuthenticateWithOAuthOutput> {
    const accountId = createAccountId(this.#deps.idGenerator.generate());
    const newAccount = Account.create({ id: accountId, email });
    const credential = Credential.create({
      id: createCredentialId(this.#deps.idGenerator.generate()),
      accountId,
      proof: createOAuthProof(provider, providerId),
    });
    await this.#deps.accountRepo.save(newAccount);
    await this.#deps.oauthStore.save(credential);
    const receipt = await this.#issueReceipt(accountId);
    this.#deps.logger.info("OAuth auto-registration", {
      accountId: accountId.toString(),
      provider,
    });
    return {
      receipt: receipt.toDTO(),
      account: newAccount.toDTO(),
      isNewAccount: true,
    };
  }

  async #issueReceipt(accountId: AccountId): Promise<Receipt> {
    const expiresAt = new Date(
      Date.now() + this.#deps.tokenLifespanMinutes * 60 * 1000,
    );
    return await this.#deps.receiptSigner.sign(accountId, expiresAt);
  }
}
