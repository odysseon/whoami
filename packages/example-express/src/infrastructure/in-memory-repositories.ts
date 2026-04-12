import {
  Account,
  AccountId,
  AccountRepository,
  Credential,
  CredentialId,
  EmailAddress,
  OAuthCredentialStore,
  PasswordCredentialStore,
} from "@odysseon/whoami-core";

export class InMemoryAccountRepository implements AccountRepository {
  private readonly store = new Map<string, Account>();

  async save(account: Account): Promise<void> {
    this.store.set(String(account.id.value), account);
  }

  async findById(id: AccountId): Promise<Account | null> {
    return this.store.get(String(id.value)) ?? null;
  }

  async findByEmail(email: EmailAddress): Promise<Account | null> {
    for (const account of this.store.values()) {
      if (account.email.value === email.value) return account;
    }
    return null;
  }

  async delete(id: AccountId): Promise<void> {
    this.store.delete(String(id.value));
  }
}

export class InMemoryPasswordCredentialStore implements PasswordCredentialStore {
  private readonly byAccountId = new Map<string, Credential>();

  async findByAccountId(accountId: AccountId): Promise<Credential | null> {
    return this.byAccountId.get(String(accountId.value)) ?? null;
  }

  async save(credential: Credential): Promise<void> {
    this.byAccountId.set(String(credential.accountId.value), credential);
  }

  async update(credentialId: CredentialId, newHash: string): Promise<void> {
    // Find the credential by its ID
    let found: Credential | undefined;
    for (const cred of this.byAccountId.values()) {
      if (cred.id.value === credentialId.value) {
        found = cred;
        break;
      }
    }

    if (!found) {
      throw new Error(`Credential with id ${credentialId.value} not found`);
    }

    // Credential is immutable; create a new one with the same id and accountId
    const updated = Credential.loadExisting({
      id: found.id,
      accountId: found.accountId,
      proof: { kind: "password", hash: newHash },
    });

    this.byAccountId.set(String(found.accountId.value), updated);
  }

  async delete(credentialId: CredentialId): Promise<void> {
    for (const [key, cred] of this.byAccountId.entries()) {
      if (cred.id.value === credentialId.value) {
        this.byAccountId.delete(key);
        return;
      }
    }
  }

  async existsForAccount(accountId: AccountId): Promise<boolean> {
    return this.byAccountId.has(String(accountId.value));
  }
}

export class InMemoryOAuthCredentialStore implements OAuthCredentialStore {
  private readonly byProvider = new Map<string, Credential>();
  private readonly byAccountId = new Map<string, Credential[]>();

  private providerKey(provider: string, providerId: string): string {
    return `${provider}:${providerId}`;
  }

  async findByProvider(
    provider: string,
    providerId: string,
  ): Promise<Credential | null> {
    return this.byProvider.get(this.providerKey(provider, providerId)) ?? null;
  }

  async findAllByAccountId(accountId: AccountId): Promise<Credential[]> {
    return this.byAccountId.get(String(accountId.value)) ?? [];
  }

  async save(credential: Credential): Promise<void> {
    const pk = this.providerKey(
      credential.oauthProvider,
      credential.oauthProviderId,
    );
    this.byProvider.set(pk, credential);
    const accountKey = String(credential.accountId.value);
    const existing = this.byAccountId.get(accountKey) ?? [];
    const idx = existing.findIndex(
      (c) =>
        c.oauthProvider === credential.oauthProvider &&
        c.oauthProviderId === credential.oauthProviderId,
    );
    if (idx >= 0) existing[idx] = credential;
    else existing.push(credential);
    this.byAccountId.set(accountKey, existing);
  }

  async delete(credentialId: CredentialId): Promise<void> {
    for (const [key, cred] of this.byProvider.entries()) {
      if (cred.id.value === credentialId.value) {
        const accountKey = String(cred.accountId.value);
        this.byAccountId.set(
          accountKey,
          (this.byAccountId.get(accountKey) ?? []).filter(
            (c) => c.id.value !== credentialId.value,
          ),
        );
        this.byProvider.delete(key);
        return;
      }
    }
  }

  async deleteByProvider(
    accountId: AccountId,
    provider: string,
  ): Promise<void> {
    const list = this.byAccountId.get(String(accountId.value)) ?? [];
    const target = list.find((c) => c.oauthProvider === provider);
    if (!target) return;
    this.byProvider.delete(
      this.providerKey(target.oauthProvider, target.oauthProviderId),
    );
    this.byAccountId.set(
      String(accountId.value),
      list.filter((c) => c.oauthProvider !== provider),
    );
  }

  async deleteAllForAccount(accountId: AccountId): Promise<void> {
    const list = this.byAccountId.get(String(accountId.value)) ?? [];
    for (const cred of list) {
      this.byProvider.delete(
        this.providerKey(cred.oauthProvider, cred.oauthProviderId),
      );
    }
    this.byAccountId.delete(String(accountId.value));
  }

  async existsForAccount(accountId: AccountId): Promise<boolean> {
    return (this.byAccountId.get(String(accountId.value)) ?? []).length > 0;
  }
}
