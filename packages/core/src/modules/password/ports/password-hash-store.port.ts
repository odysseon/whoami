import type { Credential } from "../../../kernel/domain/entities/credential.js";
import type {
  AccountId,
  CredentialId,
} from "../../../kernel/domain/value-objects/index.js";
import type { CredentialStoreBase } from "../../../kernel/ports/credential-store.port.js";
import type { PasswordHashProof } from "../entities/password.proof.js";

/**
 * Port for password hash persistence.
 */
export interface PasswordHashStore extends CredentialStoreBase {
  findByAccountId(
    accountId: AccountId,
  ): Promise<Credential<PasswordHashProof> | null>;

  findById(
    credentialId: CredentialId,
  ): Promise<Credential<PasswordHashProof> | null>;

  save(credential: Credential<PasswordHashProof>): Promise<void>;

  update(credentialId: CredentialId, proof: PasswordHashProof): Promise<void>;

  existsForAccount(accountId: AccountId): Promise<boolean>;
}
