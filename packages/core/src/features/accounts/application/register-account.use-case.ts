import { EmailAddress } from "src/shared/domain/value-objects/email-address.vo.js";
import { AccountRepository } from "../domain/account-repository.port.js";
import { Account } from "../domain/account.entity.js";
import { AccountAlreadyExistsError } from "src/shared/domain/errors/account.error.js";
import { AccountId } from "src/shared/domain/value-objects/account-id.vo.js";

export class RegisterAccountUseCase {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly generateId: () => string | number,
  ) {}

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
