import { DomainError } from "./domain.error.js";

export class WrongCredentialTypeError extends DomainError {
  constructor(expected: string, actual: string) {
    super(`Expected ${expected} credential, but got ${actual}.`);
  }
}

export class AuthenticationError extends DomainError {
  constructor(message: string = "Invalid credentials.") {
    super(message);
  }
}

export class InvalidReceiptError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
