import type { Credential } from "../../../kernel/credential/index.js";
import type { AccountId, CredentialId } from "../../../kernel/shared/index.js";

/**
 * Module-level wrapper over the kernel {@link Credential} for password flows.
 *
 * Exposes only the fields the password module needs, making module dependencies
 * explicit and preventing cross-module coupling.
 * @public
 */
export class PasswordCredential {
  public readonly id: CredentialId;
  public readonly accountId: AccountId;
  public readonly hash: string;

  private constructor(id: CredentialId, accountId: AccountId, hash: string) {
    this.id = id;
    this.accountId = accountId;
    this.hash = hash;
  }

  static fromKernel(credential: Credential): PasswordCredential {
    return new PasswordCredential(
      credential.id,
      credential.accountId,
      credential.passwordHash,
    );
  }
}
