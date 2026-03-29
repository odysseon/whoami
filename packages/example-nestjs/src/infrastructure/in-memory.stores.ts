import {
  Account,
  AccountId,
  AccountRepository,
  Credential,
  CredentialStore,
  EmailAddress,
} from "@odysseon/whoami-core";

/**
 * In-memory implementation of {@link AccountRepository}.
 * For demonstration purposes only — not for production use.
 */
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

/**
 * In-memory implementation of {@link CredentialStore}.
 * Maintains a secondary email → accountId index for lookups.
 * For demonstration purposes only — not for production use.
 */
export class InMemoryCredentialStore implements CredentialStore {
  private readonly byAccountId = new Map<string, Credential>();
  private readonly emailIndex = new Map<string, string>(); // email → accountId

  async save(credential: Credential): Promise<void> {
    this.byAccountId.set(String(credential.accountId.value), credential);
  }

  async findByEmail(email: EmailAddress): Promise<Credential | null> {
    const accountId = this.emailIndex.get(email.value);
    if (!accountId) return null;
    return this.byAccountId.get(accountId) ?? null;
  }

  /**
   * Saves a credential and registers the email index in one atomic step.
   */
  async saveWithEmail(
    credential: Credential,
    email: EmailAddress,
  ): Promise<void> {
    this.emailIndex.set(email.value, String(credential.accountId.value));
    await this.save(credential);
  }
}
