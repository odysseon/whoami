import type { CredentialId } from "../../../shared/index.js";
import type { PasswordCredentialStore } from "../domain/ports/password-credential-store.port.js";

/**
 * Dependencies for {@link RemovePasswordUseCase}.
 * @public
 */
export interface RemovePasswordDeps {
  /** Removes a password credential by its identifier. */
  credentialRemover: Pick<PasswordCredentialStore, "delete">;
}

/**
 * Input for {@link RemovePasswordUseCase.execute}.
 * @public
 */
export interface RemovePasswordInput {
  /** The {@link CredentialId} of the password credential to remove. */
  credentialId: CredentialId;
}

/**
 * Removes a password credential from an account.
 *
 * Useful for migrating from password-based to passwordless authentication.
 * Removes only the authentication method — the account itself is unaffected.
 *
 * @remarks
 * This use-case does **not** guard the "last credential" invariant. Enforce
 * that constraint in the caller (see {@link createAuth} / `removeAuthMethod`).
 *
 * @public
 */
export class RemovePasswordUseCase {
  private readonly deps: RemovePasswordDeps;

  constructor(deps: RemovePasswordDeps) {
    this.deps = deps;
  }

  /**
   * Deletes the password credential identified by `input.credentialId`.
   *
   * @param input - {@link RemovePasswordInput}
   */
  async execute(input: RemovePasswordInput): Promise<void> {
    await this.deps.credentialRemover.delete(input.credentialId);
  }
}
