import { DomainError } from "./domain.error.js";

/**
 * Thrown when a registration attempt is made for an email address that already
 * belongs to an existing account.
 *
 * @public
 */
export class AccountAlreadyExistsError extends DomainError {
  public override readonly code = "ACCOUNT_ALREADY_EXISTS" as const;

  constructor() {
    super("An account with this email address already exists.");
  }
}

/**
 * Thrown when a use case looks up an account by ID and no record is found.
 *
 * This signals a caller-side bug (bad ID) or a data-integrity issue, rather
 * than a user-facing validation failure.
 *
 * @public
 */
export class AccountNotFoundError extends DomainError {
  public override readonly code = "ACCOUNT_NOT_FOUND" as const;

  /** @param accountId - The ID that produced no result (included in the message for diagnostics). */
  constructor(accountId: string) {
    super(`Account '${accountId}' does not exist.`);
  }
}
