import type { Credential } from "../../../kernel/domain/entities/credential.js";
import type {
  AccountId,
  CredentialId,
} from "../../../kernel/domain/value-objects/index.js";
import type { CredentialStoreBase } from "../../../kernel/ports/credential-store.port.js";
import type { MagicLinkProof } from "../entities/magiclink.proof.js";

/**
 * Port for MagicLink credential persistence operations.
 */
export interface MagicLinkTokenStore extends CredentialStoreBase {
  findByTokenHash(
    tokenHash: string,
  ): Promise<Credential<MagicLinkProof> | null>;

  findAllByAccountId(
    accountId: AccountId,
  ): Promise<Credential<MagicLinkProof>[]>;

  save(credential: Credential<MagicLinkProof>): Promise<void>;

  update(credentialId: CredentialId, proof: MagicLinkProof): Promise<void>;

  deleteExpired(before: Date): Promise<void>;
}
