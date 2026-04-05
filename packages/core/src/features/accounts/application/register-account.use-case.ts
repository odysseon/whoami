import { AccountAlreadyExistsError } from "../../../shared/domain/errors/account.error.js";
import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { EmailAddress } from "../../../shared/domain/value-objects/email-address.vo.js";
import { Account } from "../domain/account.entity.js";
import type { AccountRepository } from "../domain/account-repository.port.js";

/**
 * Dependencies for {@link RegisterAccountUseCase}.
 * @public
 */
export interface RegisterAccountDeps {
  /** Persistence port for account aggregates. */
  accountRepo: AccountRepository;
  /**
   * Deterministic ID generator — must return a non-empty string on every call.
   * Inject `crypto.randomUUID` or any UUID v4 factory.
   */
  generateId: () => string;
}

/**
 * Registers a bare account without any credential.
 *
 * Use this for flows that create the account separately from the credential,
 * such as OAuth or magic-link registration. For password-based registration
 * use {@link RegisterWithPasswordUseCase} instead — it creates both the account
 * and the password credential atomically.
 *
 * @public
 */
export class RegisterAccountUseCase {
  private readonly accountRepo: AccountRepository;
  private readonly generateId: () => string;

  constructor(deps: RegisterAccountDeps) {
    this.accountRepo = deps.accountRepo;
    this.generateId = deps.generateId;
  }

  /**
   * Creates and persists a new account for the supplied email address.
   *
   * @param rawEmail - The raw email address string to register.
   * @returns The persisted {@link Account} aggregate.
   * @throws {InvalidEmailError} When `rawEmail` does not pass format validation.
   * @throws {AccountAlreadyExistsError} When an account already uses this email.
   */
  public async execute(rawEmail: string): Promise<Account> {
    const email = new EmailAddress(rawEmail);
    const existing = await this.accountRepo.findByEmail(email);

    if (existing) {
      throw new AccountAlreadyExistsError();
    }

    const account = Account.create(new AccountId(this.generateId()), email);
    await this.accountRepo.save(account);
    return account;
  }
}
