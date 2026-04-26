import { Credential } from "../../../kernel/domain/entities/index.js";
import type { AccountId } from "../../../kernel/domain/value-objects/index.js";
import { createCredentialId } from "../../../kernel/domain/value-objects/index.js";
import {
  AccountNotFoundError,
  CredentialAlreadyExistsError,
} from "../../../kernel/domain/errors/index.js";
import type { AccountRepository } from "../../../kernel/ports/account-repository.port.js";
import type {
  IdGeneratorPort,
  LoggerPort,
} from "../../../kernel/ports/index.js";
import type { OAuthCredentialStore } from "../ports/oauth-credential-store.port.js";
import { createOAuthProof } from "../entities/oauth.proof.js";

/**
 * Input for linking OAuth to account
 */
export interface LinkOAuthToAccountInput {
  readonly accountId: AccountId;
  readonly provider: string;
  readonly providerId: string;
}

/**
 * Output from linking OAuth to account
 */
export interface LinkOAuthToAccountOutput {
  readonly success: true;
}

/**
 * Use case for linking an OAuth provider to an existing account.
 * This allows users to log in with OAuth after creating an account with password.
 */
export class LinkOAuthToAccountUseCase {
  readonly #accountRepo: AccountRepository;
  readonly #oauthStore: OAuthCredentialStore;
  readonly #idGenerator: IdGeneratorPort;
  readonly #logger: LoggerPort;

  constructor(deps: {
    accountRepo: AccountRepository;
    oauthStore: OAuthCredentialStore;
    idGenerator: IdGeneratorPort;
    logger: LoggerPort;
  }) {
    this.#accountRepo = deps.accountRepo;
    this.#oauthStore = deps.oauthStore;
    this.#idGenerator = deps.idGenerator;
    this.#logger = deps.logger;
  }

  /**
   * Executes the link OAuth to account use case
   * @param input - The input
   */
  async execute(
    input: LinkOAuthToAccountInput,
  ): Promise<LinkOAuthToAccountOutput> {
    // Find account
    const account = await this.#accountRepo.findById(input.accountId);
    if (!account) {
      throw new AccountNotFoundError(input.accountId.toString());
    }

    // Check if this OAuth credential is already linked to another account
    const existingCredential = await this.#oauthStore.findByProvider(
      input.provider,
      input.providerId,
    );

    if (existingCredential) {
      if (
        existingCredential.accountId.toString() === input.accountId.toString()
      ) {
        throw new CredentialAlreadyExistsError(
          `This ${input.provider} account is already linked to your account`,
        );
      } else {
        throw new CredentialAlreadyExistsError(
          `This ${input.provider} account is already linked to another account`,
        );
      }
    }

    // Check if account already has this provider linked
    const existingCredentials = await this.#oauthStore.findAllByAccountId(
      input.accountId,
    );
    const hasProvider = existingCredentials.some(
      (c) => c.proof.provider === input.provider,
    );

    if (hasProvider) {
      throw new CredentialAlreadyExistsError(
        `Your account already has a ${input.provider} account linked`,
      );
    }

    // Create OAuth credential
    const credentialId = createCredentialId(this.#idGenerator.generate());
    const credential = Credential.create({
      id: credentialId,
      accountId: input.accountId,
      proof: createOAuthProof(input.provider, input.providerId),
    });

    await this.#oauthStore.save(credential);

    this.#logger.info("OAuth provider linked to account", {
      accountId: input.accountId.toString(),
      provider: input.provider,
    });

    return { success: true };
  }
}
