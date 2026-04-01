import { CredentialId } from "../../../shared/index.js";
import { PasswordCredentialStore } from "../domain/ports/password-credential-store.port.js";

export interface RemovePasswordDeps {
  passwordStore: PasswordCredentialStore;
}

export interface RemovePasswordInput {
  credentialId: string;
}

/**
 * Removes a password credential from an account.
 *
 * Useful for migrating from password-based to passwordless authentication.
 * Does not delete the account itself — only the authentication method.
 *
 * @throws {CredentialNotFoundError} When no credential with the given ID exists.
 */
export class RemovePasswordUseCase {
  private readonly deps: RemovePasswordDeps;
  constructor(deps: RemovePasswordDeps) {
    this.deps = deps;
  }

  async execute(input: RemovePasswordInput): Promise<void> {
    const credentialId = new CredentialId(input.credentialId);
    await this.deps.passwordStore.delete(credentialId);
  }
}
