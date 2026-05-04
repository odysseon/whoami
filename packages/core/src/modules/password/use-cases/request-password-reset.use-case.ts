import { Credential } from "../../../kernel/domain/entities/index.js";
import type { EmailAddress } from "../../../kernel/domain/value-objects/index.js";
import {
  createCredentialId,
  createEmailAddress,
} from "../../../kernel/domain/value-objects/index.js";
import { InvalidEmailError } from "../../../kernel/domain/errors/index.js";
import { createPasswordResetProof } from "../entities/password.proof.js";
import type {
  RequestPasswordResetInput,
  RequestPasswordResetOutput,
  RequestPasswordResetDeps,
} from "../password.config.js";

export class RequestPasswordResetUseCase {
  readonly #deps: RequestPasswordResetDeps;

  constructor(deps: RequestPasswordResetDeps) {
    this.#deps = deps;
  }

  async execute(
    input: RequestPasswordResetInput,
  ): Promise<RequestPasswordResetOutput | null> {
    let email: EmailAddress;
    try {
      email = createEmailAddress(input.email);
    } catch {
      throw new InvalidEmailError(`Invalid email: ${input.email}`);
    }

    const account = await this.#deps.accountRepo.findByEmail(email);
    if (!account) {
      this.#deps.logger.warn(
        "Password reset requested for non-existent account",
        {
          email: input.email,
        },
      );
      return null;
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
      proof: createPasswordResetProof(tokenHash, expiresAt),
    });

    await this.#deps.resetTokenStore.save(credential);

    this.#deps.logger.info("Password reset challenge created", {
      accountId: account.id.toString(),
      challengeId: challengeId.toString(),
      expiresAt: expiresAt.toISOString(),
    });

    return { challengeId, plainTextToken, expiresAt };
  }
}
