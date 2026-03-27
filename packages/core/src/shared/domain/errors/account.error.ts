import { DomainError } from "./domain.error.js";

export class AccountAlreadyExistsError extends DomainError {
  constructor() {
    super("An account with this email address already exists.");
  }
}
