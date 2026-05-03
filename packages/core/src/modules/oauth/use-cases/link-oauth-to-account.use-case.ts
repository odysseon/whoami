import { Credential } from "../../../kernel/domain/entities/index.js";
import { createCredentialId } from "../../../kernel/domain/value-objects/index.js";
import {
  AccountNotFoundError,
  CredentialAlreadyExistsError,
} from "../../../kernel/domain/errors/index.js";
import { createOAuthProof } from "../entities/oauth.proof.js";
import type {
  LinkOAuthToAccountInput,
  LinkOAuthToAccountOutput,
  LinkOAuthToAccountDeps,
} from "../oauth.config.js";

export class LinkOAuthToAccountUseCase {
  readonly #deps: LinkOAuthToAccountDeps;

  constructor(deps: LinkOAuthToAccountDeps) {
    this.#deps = deps;
  }

  async execute(
    input: LinkOAuthToAccountInput,
  ): Promise<LinkOAuthToAccountOutput> {
    const account = await this.#deps.accountRepo.findById(input.accountId);
    if (!account) {
      throw new AccountNotFoundError(input.accountId.toString());
    }

    const existingCredential = await this.#deps.oauthStore.findByProvider(
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

    const existingCredentials = await this.#deps.oauthStore.findAllByAccountId(
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

    const credentialId = createCredentialId(this.#deps.idGenerator.generate());
    const credential = Credential.create({
      id: credentialId,
      accountId: input.accountId,
      proof: createOAuthProof(input.provider, input.providerId),
    });

    await this.#deps.oauthStore.save(credential);

    this.#deps.logger.info("OAuth provider linked to account", {
      accountId: input.accountId.toString(),
      provider: input.provider,
    });

    return { success: true };
  }
}
