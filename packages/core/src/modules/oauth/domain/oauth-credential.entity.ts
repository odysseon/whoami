import type { Credential } from "../../../kernel/credential/index.js";
import { OAuthProof } from "../../../kernel/credential/credential.types.js";
import type { AccountId, CredentialId } from "../../../kernel/shared/index.js";
import { WrongCredentialTypeError } from "../../../kernel/shared/index.js";

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
    const proof = credential.getProof();
    if (!(proof instanceof OAuthProof))
      throw new WrongCredentialTypeError("oauth", credential.proofKind);
    return new OAuthCredential(
      credential.id,
      credential.accountId,
      proof.provider,
      proof.providerId,
    );
  }
}
