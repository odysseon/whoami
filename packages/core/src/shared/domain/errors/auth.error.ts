import { DomainError } from "./domain.error.js";

export class WrongCredentialTypeError extends DomainError {
  public override readonly code = "WRONG_CREDENTIAL_TYPE" as const;

  constructor(expected: string, actual: string) {
    super(`Expected ${expected} credential, but got ${actual}.`);
  }
}

export class AuthenticationError extends DomainError {
  public override readonly code = "AUTHENTICATION_ERROR" as const;

  constructor(message: string = "Invalid credentials.") {
    super(message);
  }
}

export class InvalidReceiptError extends DomainError {
  public override readonly code = "INVALID_RECEIPT" as const;

  constructor(message: string) {
    super(message);
  }
}
