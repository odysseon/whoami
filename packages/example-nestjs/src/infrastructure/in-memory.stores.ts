import {
  Account,
  AccountId,
  AccountRepository,
  Credential,
  CredentialId,
  EmailAddress,
  OAuthCredentialStore,
  PasswordCredentialStore,
  type PasswordProof,
  type OAuthProof,
} from "@odysseon/whoami-core";

/**
 * In-memory implementation of {@link AccountRepository}.
 * For demonstration purposes only — not for production use.
 */
export class InMemoryAccountRepository implements AccountRepository {
  private readonly store = new Map<string, Account>();
  private readonly emailIndex = new Map<string, Account>();

  async save(account: Account): Promise<void> {
    this.store.set(String(account.id), account);
    this.emailIndex.set(String(account.email), account);
  }

  async findById(id: AccountId): Promise<Account | null> {
    return this.store.get(String(id)) ?? null;
  }

  async findByEmail(email: EmailAddress): Promise<Account | null> {
    return this.emailIndex.get(String(email)) ?? null;
  }

  async delete(id: AccountId): Promise<void> {
    const account = this.store.get(String(id));
    if (account) {
      this.emailIndex.delete(String(account.email));
    }
    this.store.delete(String(id));
  }

  async existsByEmail(email: EmailAddress): Promise<boolean> {
    return this.emailIndex.has(String(email));
  }
}

/**
 * In-memory implementation of {@link PasswordCredentialStore}.
 * For demonstration purposes only — not for production use.
 */
export class InMemoryPasswordCredentialStore implements PasswordCredentialStore {
  private readonly byAccountId = new Map<string, Credential<PasswordProof>>();
  private readonly byId = new Map<string, Credential<PasswordProof>>();
  private readonly byTokenHash = new Map<string, Credential<PasswordProof>>();

  async findByAccountId(
    accountId: AccountId,
  ): Promise<Credential<PasswordProof> | null> {
    return this.byAccountId.get(String(accountId)) ?? null;
  }

  async findById(
    credentialId: CredentialId,
  ): Promise<Credential<PasswordProof> | null> {
    return this.byId.get(String(credentialId)) ?? null;
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<Credential<PasswordProof> | null> {
    return this.byTokenHash.get(tokenHash) ?? null;
  }

  async save(credential: Credential<PasswordProof>): Promise<void> {
    this.byAccountId.set(String(credential.accountId), credential);
    this.byId.set(String(credential.id), credential);
    const proof = credential.proof;
    if (proof.kind === "password_reset") {
      this.byTokenHash.set(proof.tokenHash, credential);
    }
  }

  async update(
    credentialId: CredentialId,
    proof: PasswordProof,
  ): Promise<void> {
    const found = this.byId.get(String(credentialId));
    if (!found) {
      throw new Error(`Credential ${String(credentialId)} not found`);
    }
    const updated = Credential.load<PasswordProof>({
      id: found.id,
      accountId: found.accountId,
      proof,
      createdAt: found.createdAt,
    });
    this.byId.set(String(updated.id), updated);
    this.byAccountId.set(String(updated.accountId), updated);
    if (proof.kind === "password_reset") {
      this.byTokenHash.set(proof.tokenHash, updated);
    }
  }

  async delete(credentialId: CredentialId): Promise<void> {
    const cred = this.byId.get(String(credentialId));
    if (!cred) return;
    this.byId.delete(String(credentialId));
    this.byAccountId.delete(String(cred.accountId));
    if (cred.proof.kind === "password_reset") {
      this.byTokenHash.delete(cred.proof.tokenHash);
    }
  }

  async existsForAccount(accountId: AccountId): Promise<boolean> {
    return this.byAccountId.has(String(accountId));
  }

  async countForAccount(accountId: AccountId): Promise<number> {
    return this.byAccountId.has(String(accountId)) ? 1 : 0;
  }

  async deleteAllResetCredentialsForAccount(
    accountId: AccountId,
  ): Promise<void> {
    const cred = this.byAccountId.get(String(accountId));
    if (cred && cred.proof.kind === "password_reset") {
      await this.delete(cred.id);
    }
  }

  async deleteExpiredResetCredentials(before: Date): Promise<void> {
    for (const cred of this.byId.values()) {
      if (
        cred.proof.kind === "password_reset" &&
        cred.proof.expiresAt <= before
      ) {
        await this.delete(cred.id);
      }
    }
  }
}

/**
 * In-memory implementation of {@link OAuthCredentialStore}.
 * For demonstration purposes only — not for production use.
 */
export class InMemoryOAuthCredentialStore implements OAuthCredentialStore {
  private readonly byProvider = new Map<string, Credential<OAuthProof>>();
  private readonly byAccountId = new Map<string, Credential<OAuthProof>[]>();
  private readonly byId = new Map<string, Credential<OAuthProof>>();

  private providerKey(provider: string, providerId: string): string {
    return `${provider}:${providerId}`;
  }

  async findByProvider(
    provider: string,
    providerId: string,
  ): Promise<Credential<OAuthProof> | null> {
    return this.byProvider.get(this.providerKey(provider, providerId)) ?? null;
  }

  async findAllByAccountId(
    accountId: AccountId,
  ): Promise<Credential<OAuthProof>[]> {
    return this.byAccountId.get(String(accountId)) ?? [];
  }

  async save(credential: Credential<OAuthProof>): Promise<void> {
    const { provider, providerId } = credential.proof;
    const pk = this.providerKey(provider, providerId);
    this.byProvider.set(pk, credential);
    this.byId.set(String(credential.id), credential);
    const accountKey = String(credential.accountId);
    const existing = this.byAccountId.get(accountKey) ?? [];
    const idx = existing.findIndex(
      (c) => c.proof.provider === provider && c.proof.providerId === providerId,
    );
    if (idx >= 0) existing[idx] = credential;
    else existing.push(credential);
    this.byAccountId.set(accountKey, existing);
  }

  async delete(credentialId: CredentialId): Promise<void> {
    const cred = this.byId.get(String(credentialId));
    if (!cred) return;
    const { provider, providerId } = cred.proof;
    this.byProvider.delete(this.providerKey(provider, providerId));
    this.byId.delete(String(credentialId));
    const accountKey = String(cred.accountId);
    const list = this.byAccountId.get(accountKey) ?? [];
    this.byAccountId.set(
      accountKey,
      list.filter((c) => String(c.id) !== String(credentialId)),
    );
  }

  async deleteByProvider(
    accountId: AccountId,
    provider: string,
  ): Promise<void> {
    const list = this.byAccountId.get(String(accountId)) ?? [];
    const target = list.find((c) => c.proof.provider === provider);
    if (!target) return;
    await this.delete(target.id);
  }

  async deleteAllForAccount(accountId: AccountId): Promise<void> {
    const list = this.byAccountId.get(String(accountId)) ?? [];
    for (const cred of list) {
      this.byProvider.delete(
        this.providerKey(cred.proof.provider, cred.proof.providerId),
      );
      this.byId.delete(String(cred.id));
    }
    this.byAccountId.delete(String(accountId));
  }

  async existsForAccount(accountId: AccountId): Promise<boolean> {
    return (this.byAccountId.get(String(accountId)) ?? []).length > 0;
  }

  async countForAccount(accountId: AccountId): Promise<number> {
    return (this.byAccountId.get(String(accountId)) ?? []).length;
  }
}
