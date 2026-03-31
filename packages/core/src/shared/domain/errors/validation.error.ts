import { DomainError } from "./domain.error.js";

export class InvalidEmailError extends DomainError {
  public override readonly code = "INVALID_EMAIL" as const;

  constructor() {
    super("The provided email address format is invalid.");
  }
}

export class InvalidConfigurationError extends DomainError {
  public override readonly code = "INVALID_CONFIGURATION" as const;

  constructor(message: string) {
    super(message);
  }
}
