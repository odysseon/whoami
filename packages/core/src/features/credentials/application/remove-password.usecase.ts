import { CredentialId } from "../../../shared/index.js";
import { PasswordCredentialStore } from "../domain/ports/password-credential-store.port.js";

/**
 * Dependencies for {@link RemovePasswordUseCase}.
 * @public
 */
export interface RemovePasswordDeps {
  /** Persistence port for password credentials. */
  passwordStore: PasswordCredentialStore;
}

/**
 * Input for {@link RemovePasswordUseCase.execute}.
 * @public
 */
export interface RemovePasswordInput {
  /** The string ID of the password credential to remove. */
  credentialId: string;
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
   * @throws {InvalidCredentialIdError} When `credentialId` is empty or blank.
   */
  async execute(input: RemovePasswordInput): Promise<void> {
    const credentialId = new CredentialId(input.credentialId);
    await this.deps.passwordStore.delete(credentialId);
  }
}
