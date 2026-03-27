import { AccountAlreadyExistsError } from "../../../shared/domain/errors/account.error.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { EmailAddress } from "../../../shared/domain/value-objects/email-address.vo.js";
import { Account } from "../domain/account.entity.js";
import type { AccountRepository } from "../domain/account-repository.port.js";

/**
 * Registers a new account after enforcing email uniqueness.
 */
export class RegisterAccountUseCase {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly generateId: () => string | number,
  ) {}

  /**
   * Creates and persists a new account for the supplied email address.
   *
   * @param rawEmail - The email address to register.
   * @returns The persisted account aggregate.
   * @throws {AccountAlreadyExistsError} When an account already uses the email address.
   */
  public async execute(rawEmail: string): Promise<Account> {
    const email = new EmailAddress(rawEmail);
    const existingAccount = await this.accountRepo.findByEmail(email);

    if (existingAccount) {
      throw new AccountAlreadyExistsError();
    }

    const newId = new AccountId(this.generateId());
    const newAccount = Account.create(newId, email);

    await this.accountRepo.save(newAccount);

    return newAccount;
  }
}
