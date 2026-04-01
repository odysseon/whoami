import { AccountAlreadyExistsError } from "../../../shared/domain/errors/account.error.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { EmailAddress } from "../../../shared/domain/value-objects/email-address.vo.js";
import { Account } from "../domain/account.entity.js";
import type { AccountRepository } from "../domain/account-repository.port.js";

export interface RegisterAccountDeps {
  accountRepo: AccountRepository;
  generateId: () => string | number;
}

/**
 * Registers a bare account without any credential.
 *
 * Use this for flows that create the account separately from the credential,
 * such as OAuth or magic-link registration. For password-based registration,
 * use {@link RegisterWithPasswordUseCase} instead — it creates both the account
 * and the password credential atomically.
 */
export class RegisterAccountUseCase {
  private readonly accountRepo: AccountRepository;
  private readonly generateId: () => string | number;

  constructor(deps: RegisterAccountDeps) {
    this.accountRepo = deps.accountRepo;
    this.generateId = deps.generateId;
  }

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
