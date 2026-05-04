import { Credential } from "../../../kernel/domain/entities/index.js";
import {
  createAccountId,
  createCredentialId,
} from "../../../kernel/domain/value-objects/index.js";
import { Account } from "../../../kernel/domain/entities/account.js";
import { createMagicLinkProof } from "../entities/magiclink.proof.js";
import type {
  RequestMagicLinkInput,
  RequestMagicLinkOutput,
  RequestMagicLinkDeps,
} from "../magiclink.config.js";
import { parseEmail } from "../../../kernel/shared/index.js";

export class RequestMagicLinkUseCase {
  readonly #deps: RequestMagicLinkDeps;

  constructor(deps: RequestMagicLinkDeps) {
    this.#deps = deps;
  }

  async execute(input: RequestMagicLinkInput): Promise<RequestMagicLinkOutput> {
    const email = parseEmail(input.email);

    let account = await this.#deps.accountRepo.findByEmail(email);
    let isNewAccount = false;

    if (!account) {
      const accountId = createAccountId(this.#deps.idGenerator.generate());
      account = Account.create({
        id: accountId,
        email,
      });
      await this.#deps.accountRepo.save(account);
      isNewAccount = true;

      this.#deps.logger.info("MagicLink auto-registration", {
        accountId: accountId.toString(),
        email: input.email,
      });
    }

    const plainTextToken = this.#deps.secureToken.generateToken();
    const tokenHash = await this.#deps.secureToken.hashToken(plainTextToken);

    const expiresAt = new Date(
      this.#deps.clock.now().getTime() +
        this.#deps.config.tokenLifespanMinutes * 60 * 1000,
    );

    const challengeId = createCredentialId(this.#deps.idGenerator.generate());
    const credential = Credential.create({
      id: challengeId,
      accountId: account.id,
      proof: createMagicLinkProof(tokenHash, email.toString(), expiresAt),
    });

    await this.#deps.magicLinkStore.save(credential);

    this.#deps.logger.info("MagicLink challenge created", {
      accountId: account.id.toString(),
      challengeId: challengeId.toString(),
      expiresAt: expiresAt.toISOString(),
    });

    return {
      challengeId: challengeId.toString(),
      plainTextToken,
      expiresAt,
      isNewAccount,
    };
  }
}
