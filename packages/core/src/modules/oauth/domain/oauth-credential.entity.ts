import type { Credential } from "../../../kernel/credential/index.js";
import type { AccountId, CredentialId } from "../../../kernel/shared/index.js";

/**
 * Module-level wrapper over the kernel {@link Credential} for OAuth flows.
 * @public
 */
export class OAuthCredential {
  public readonly id: CredentialId;
  public readonly accountId: AccountId;
  public readonly provider: string;
  public readonly providerId: string;

  private constructor(
    id: CredentialId,
    accountId: AccountId,
    provider: string,
    providerId: string,
  ) {
    this.id = id;
    this.accountId = accountId;
    this.provider = provider;
    this.providerId = providerId;
  }

  static fromKernel(credential: Credential): OAuthCredential {
    return new OAuthCredential(
      credential.id,
      credential.accountId,
      credential.oauthProvider,
      credential.oauthProviderId,
    );
  }
}
