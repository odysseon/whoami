import { parseEmail } from "../../../kernel/shared/index.js";
import { AuthenticationError } from "../../../kernel/domain/errors/index.js";
import type {
  AuthenticateWithPasswordInput,
  AuthenticateWithPasswordOutput,
  AuthenticateWithPasswordDeps,
} from "../password.config.js";

export class AuthenticateWithPasswordUseCase {
  readonly #deps: AuthenticateWithPasswordDeps;

  constructor(deps: AuthenticateWithPasswordDeps) {
    this.#deps = deps;
  }

  async execute(
    input: AuthenticateWithPasswordInput,
  ): Promise<AuthenticateWithPasswordOutput> {
    const email = parseEmail(input.email);

    const account = await this.#deps.accountRepo.findByEmail(email);
    if (!account) {
      this.#deps.logger.warn(
        "Authentication attempt for non-existent account",
        {
          email: input.email,
        },
      );
      throw new AuthenticationError("Invalid credentials");
    }

    const credential = await this.#deps.passwordHashStore.findByAccountId(
      account.id,
    );
    if (!credential) {
      this.#deps.logger.warn(
        "Authentication attempt for account without password",
        {
          accountId: account.id.toString(),
        },
      );
      throw new AuthenticationError("Invalid credentials");
    }

    const proof = credential.proof;
    const isValid = await this.#deps.passwordHasher.compare(
      input.password,
      proof.hash,
    );
    if (!isValid) {
      this.#deps.logger.warn("Authentication attempt with wrong password", {
        accountId: account.id.toString(),
      });
      throw new AuthenticationError("Invalid credentials");
    }

    const expiresAt = new Date(
      Date.now() + this.#deps.tokenLifespanMinutes * 60 * 1000,
    );
    const receipt = await this.#deps.receiptSigner.sign(account.id, expiresAt);

    this.#deps.logger.info("Account authenticated with password", {
      accountId: account.id.toString(),
    });

    return { receipt: receipt.toDTO(), account: account.toDTO() };
  }
}
