import { DomainError } from "./domain.error.js";

export class AccountAlreadyExistsError extends DomainError {
  public override readonly code = "ACCOUNT_ALREADY_EXISTS" as const;

  constructor() {
    super("An account with this email address already exists.");
  }
}
