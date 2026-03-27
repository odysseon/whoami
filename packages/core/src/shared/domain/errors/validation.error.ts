import { DomainError } from "./domain.error.js";

export class InvalidEmailError extends DomainError {
  constructor() {
    super("The provided email address format is invalid.");
  }
}

export class InvalidConfigurationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
