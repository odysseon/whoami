import type { Credential } from "../../../kernel/domain/entities/credential.js";
import type { AccountId } from "../../../kernel/domain/value-objects/index.js";
import type { CredentialStoreBase } from "../../../kernel/ports/credential-store.port.js";
import type { OAuthProof } from "../entities/oauth.proof.js";

/**
 * Port for OAuth credential persistence operations.
 */
export interface OAuthCredentialStore extends CredentialStoreBase {
  findByProvider(
    provider: string,
    providerId: string,
  ): Promise<Credential<OAuthProof> | null>;

  findAllByAccountId(accountId: AccountId): Promise<Credential<OAuthProof>[]>;

  save(credential: Credential<OAuthProof>): Promise<void>;

  deleteByProvider(accountId: AccountId, provider: string): Promise<void>;
}
