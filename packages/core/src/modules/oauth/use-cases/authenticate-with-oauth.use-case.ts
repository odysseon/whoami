import { Credential, Receipt } from "../../../kernel/domain/entities/index.js";
import type { EmailAddress } from "../../../kernel/domain/value-objects/index.js";
import {
  createAccountId,
  createCredentialId,
  createEmailAddress,
} from "../../../kernel/domain/value-objects/index.js";
import {
  AuthenticationError,
  InvalidEmailError,
} from "../../../kernel/domain/errors/index.js";
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

    const existingCredential = await this.#deps.oauthStore.findByProvider(
      input.provider,
      input.providerId,
    );

    if (existingCredential) {
      const account = await this.#deps.accountRepo.findById(
        existingCredential.accountId,
      );
      if (!account) {
        this.#deps.logger.error("Orphaned OAuth credential", {
          provider: input.provider,
          providerId: input.providerId,
        });
        throw new AuthenticationError("Account not found");
      }

      const receipt = await this.#issueReceipt(account.id);

      this.#deps.logger.info("OAuth authentication (fast path)", {
        accountId: account.id.toString(),
        provider: input.provider,
      });

      return {
        receipt,
        account: account.toDTO(),
        isNewAccount: false,
      };
    }

    const existingAccount = await this.#deps.accountRepo.findByEmail(email);

    if (existingAccount) {
      this.#deps.logger.warn(
        "OAuth conflict: account exists without OAuth link",
        {
          email: input.email,
          provider: input.provider,
        },
      );
      throw new AuthenticationError(
        "An account already exists with this email. Please log in with your existing method and link this provider in settings.",
      );
    }

    const accountId = createAccountId(this.#deps.idGenerator.generate());
    const newAccount = Account.create({
      id: accountId,
      email,
    });

    const credentialId = createCredentialId(this.#deps.idGenerator.generate());
    const credential = Credential.create({
      id: credentialId,
      accountId,
      proof: createOAuthProof(input.provider, input.providerId),
    });

    await this.#deps.accountRepo.save(newAccount);
    await this.#deps.oauthStore.save(credential);

    const receipt = await this.#issueReceipt(accountId);

    this.#deps.logger.info("OAuth auto-registration", {
      accountId: accountId.toString(),
      provider: input.provider,
    });

    return {
      receipt,
      account: newAccount.toDTO(),
      isNewAccount: true,
    };
  }

  async #issueReceipt(
    accountId: ReturnType<typeof createAccountId>,
  ): Promise<Receipt> {
    const expiresAt = new Date(
      Date.now() + this.#deps.tokenLifespanMinutes * 60 * 1000,
    );
    return await this.#deps.receiptSigner.sign(accountId, expiresAt);
  }
}
