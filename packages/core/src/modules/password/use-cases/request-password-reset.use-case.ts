import { Credential } from "../../../kernel/domain/entities/index.js";
import { createCredentialId } from "../../../kernel/domain/value-objects/index.js";
import { createPasswordResetProof } from "../entities/password.proof.js";
import type {
  RequestPasswordResetInput,
  RequestPasswordResetOutput,
  RequestPasswordResetDeps,
} from "../password.config.js";
import { parseEmail } from "../../../kernel/shared/index.js";

export class RequestPasswordResetUseCase {
  readonly #deps: RequestPasswordResetDeps;

  constructor(deps: RequestPasswordResetDeps) {
    this.#deps = deps;
  }

  async execute(
    input: RequestPasswordResetInput,
  ): Promise<RequestPasswordResetOutput | null> {
    const email = parseEmail(input.email);

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
