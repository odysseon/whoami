import {
  Account,
  Credential,
  isPasswordResetProof,
  isOAuthProof,
} from "@odysseon/whoami-core";
import type {
  AccountId,
  AccountRepository,
  CredentialId,
  EmailAddress,
  PasswordCredentialStore,
  PasswordProof,
  OAuthCredentialStore,
  OAuthProof,
} from "@odysseon/whoami-core";

export class InMemoryAccountRepository implements AccountRepository {
  readonly #byId = new Map<string, Account>();
  readonly #byEmail = new Map<string, Account>();

  async save(account: Account): Promise<void> {
    this.#byId.set(String(account.id), account);
    this.#byEmail.set(String(account.email), account);
  }

  async findById(id: AccountId): Promise<Account | null> {
    return this.#byId.get(String(id)) ?? null;
  }

  async findByEmail(email: EmailAddress): Promise<Account | null> {
    return this.#byEmail.get(String(email)) ?? null;
  }

  async delete(id: AccountId): Promise<void> {
    const account = this.#byId.get(String(id));
    if (!account) return;
    this.#byId.delete(String(id));
    this.#byEmail.delete(String(account.email));
  }

  async existsByEmail(email: EmailAddress): Promise<boolean> {
    return this.#byEmail.has(String(email));
  }
}

export class InMemoryPasswordCredentialStore implements PasswordCredentialStore {
  readonly #byAccountId = new Map<string, Credential<PasswordProof>>();
  readonly #byId = new Map<string, Credential<PasswordProof>>();
  readonly #byTokenHash = new Map<string, Credential<PasswordProof>>();

  async findByAccountId(
    accountId: AccountId,
  ): Promise<Credential<PasswordProof> | null> {
    return this.#byAccountId.get(String(accountId)) ?? null;
  }

  async findById(
    credentialId: CredentialId,
  ): Promise<Credential<PasswordProof> | null> {
    return this.#byId.get(String(credentialId)) ?? null;
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<Credential<PasswordProof> | null> {
    return this.#byTokenHash.get(tokenHash) ?? null;
  }

  async save(credential: Credential<PasswordProof>): Promise<void> {
    this.#byAccountId.set(String(credential.accountId), credential);
    this.#byId.set(String(credential.id), credential);
    if (isPasswordResetProof(credential.proof)) {
      this.#byTokenHash.set(credential.proof.tokenHash, credential);
    }
  }

  async update(
    credentialId: CredentialId,
    proof: PasswordProof,
  ): Promise<void> {
    const existing = this.#byId.get(String(credentialId));
    if (!existing) throw new Error("Credential not found");
    if (isPasswordResetProof(existing.proof)) {
      this.#byTokenHash.delete(existing.proof.tokenHash);
    }

    const updated = Credential.load<PasswordProof>({
      id: existing.id,
      accountId: existing.accountId,
      proof,
      createdAt: existing.createdAt,
    });
    this.save(updated);
  }

  async delete(credentialId: CredentialId): Promise<void> {
    const existing = this.#byId.get(String(credentialId));
    if (!existing) return;
    this.#byId.delete(String(credentialId));
    this.#byAccountId.delete(String(existing.accountId));
    if (isPasswordResetProof(existing.proof)) {
      this.#byTokenHash.delete(existing.proof.tokenHash);
    }
  }

  async existsForAccount(accountId: AccountId): Promise<boolean> {
    return this.#byAccountId.has(String(accountId));
  }

  async countForAccount(accountId: AccountId): Promise<number> {
    return this.#byAccountId.has(String(accountId)) ? 1 : 0;
  }

  async deleteAllResetCredentialsForAccount(
    accountId: AccountId,
  ): Promise<void> {
    const existing = this.#byAccountId.get(String(accountId));
    if (!existing) return;
    if (isPasswordResetProof(existing.proof)) {
      this.#byTokenHash.delete(existing.proof.tokenHash);
      this.#byId.delete(String(existing.id));
      this.#byAccountId.delete(String(accountId));
    }
  }

  async deleteExpiredResetCredentials(before: Date): Promise<void> {
    for (const [id, credential] of this.#byId.entries()) {
      if (
        isPasswordResetProof(credential.proof) &&
        credential.proof.expiresAt < before
      ) {
        this.#byId.delete(id);
        this.#byAccountId.delete(String(credential.accountId));
        this.#byTokenHash.delete(credential.proof.tokenHash);
      }
    }
  }
}

export class InMemoryOAuthCredentialStore implements OAuthCredentialStore {
  readonly #byProvider = new Map<string, Credential<OAuthProof>>();
  readonly #byAccountId = new Map<string, Credential<OAuthProof>[]>();
  readonly #byId = new Map<string, Credential<OAuthProof>>();

  #providerKey(provider: string, providerId: string): string {
    return `${provider}:${providerId}`;
  }

  async findByProvider(
    provider: string,
    providerId: string,
  ): Promise<Credential<OAuthProof> | null> {
    const credential = this.#byProvider.get(
      this.#providerKey(provider, providerId),
    );
    if (!credential || !isOAuthProof(credential.proof)) return null;
    return credential;
  }

  async findAllByAccountId(
    accountId: AccountId,
  ): Promise<Credential<OAuthProof>[]> {
    const credentials = this.#byAccountId.get(String(accountId)) ?? [];
    return credentials.filter((c) => isOAuthProof(c.proof));
  }

  async save(credential: Credential<OAuthProof>): Promise<void> {
    this.#byId.set(String(credential.id), credential);
    this.#byProvider.set(
      this.#providerKey(credential.proof.provider, credential.proof.providerId),
      credential,
    );
    const existing = this.#byAccountId.get(String(credential.accountId)) ?? [];
    this.#byAccountId.set(String(credential.accountId), [
      ...existing,
      credential,
    ]);
  }

  async delete(credentialId: CredentialId): Promise<void> {
    const existing = this.#byId.get(String(credentialId));
    if (!existing) return;
    this.#byId.delete(String(credentialId));
    if (isOAuthProof(existing.proof)) {
      this.#byProvider.delete(
        this.#providerKey(existing.proof.provider, existing.proof.providerId),
      );
    }
    const accountCredentials =
      this.#byAccountId.get(String(existing.accountId)) ?? [];
    this.#byAccountId.set(
      String(existing.accountId),
      accountCredentials.filter((c) => c.id !== credentialId),
    );
  }

  async deleteByProvider(
    accountId: AccountId,
    provider: string,
  ): Promise<void> {
    const accountCredentials = this.#byAccountId.get(String(accountId)) ?? [];
    const toDelete = accountCredentials.filter(
      (c) => isOAuthProof(c.proof) && c.proof.provider === provider,
    );
    for (const credential of toDelete) {
      await this.delete(credential.id);
    }
  }

  async deleteAllForAccount(accountId: AccountId): Promise<void> {
    const accountCredentials = this.#byAccountId.get(String(accountId)) ?? [];
    for (const credential of accountCredentials) {
      this.#byId.delete(String(credential.id));
      if (isOAuthProof(credential.proof)) {
        this.#byProvider.delete(
          this.#providerKey(
            credential.proof.provider,
            credential.proof.providerId,
          ),
        );
      }
    }
    this.#byAccountId.delete(String(accountId));
  }

  async existsForAccount(accountId: AccountId): Promise<boolean> {
    const credentials = this.#byAccountId.get(String(accountId)) ?? [];
    return credentials.length > 0;
  }

  async countForAccount(accountId: AccountId): Promise<number> {
    const credentials = this.#byAccountId.get(String(accountId)) ?? [];
    return credentials.length;
  }
}
