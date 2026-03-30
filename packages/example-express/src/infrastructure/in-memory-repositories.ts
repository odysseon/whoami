import {
  type AccountRepository,
  Account,
  type CredentialStore,
  Credential,
  AccountId,
  EmailAddress,
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
}

export class InMemoryCredentialStore implements CredentialStore {
  private readonly store = new Map<string, Credential>();
  readonly emailIndex = new Map<string, string>();

  async save(credential: Credential): Promise<void> {
    this.store.set(credential.accountId.value.toString(), credential);
  }

  async findByEmail(email: EmailAddress): Promise<Credential | null> {
    const accountId = this.emailIndex.get(email.value);
    if (accountId) {
      return this.store.get(accountId) ?? null;
    }
    return null;
  }

  async deleteByEmail(email: EmailAddress): Promise<void> {
    const accountId = this.emailIndex.get(email.value);
    if (accountId) {
      this.store.delete(accountId);
      this.emailIndex.delete(email.value);
    }
  }

  async saveWithEmail(
    credential: Credential,
    email: EmailAddress,
  ): Promise<void> {
    this.emailIndex.set(email.value, credential.accountId.value.toString());
    await this.save(credential);
  }
}
