/**
 * Stable machine-readable discriminant for every domain error.
 * Switch on this instead of instanceof or message string-matching.
 * @public
 */
export type DomainErrorCode =
  | "ACCOUNT_ALREADY_EXISTS"
  | "AUTHENTICATION_ERROR"
  | "INVALID_RECEIPT"
  | "WRONG_CREDENTIAL_TYPE"
  | "INVALID_EMAIL"
  | "INVALID_CONFIGURATION"
  | "INVALID_ACCOUNT_ID"
  | "INVALID_CREDENTIAL_ID"
  | "INVALID_CREDENTIAL"
  | "ACCOUNT_NOT_FOUND"
  | "CREDENTIAL_ALREADY_EXISTS"
  | "OAUTH_PROVIDER_NOT_FOUND"
  | "CANNOT_REMOVE_LAST_CREDENTIAL"
  | "UNSUPPORTED_AUTH_METHOD";

export abstract class DomainError extends Error {
  public abstract readonly code: DomainErrorCode;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    const ctor = Error as unknown as Record<string, unknown>;
    if (typeof ctor["captureStackTrace"] === "function") {
      (ctor["captureStackTrace"] as (t: object, c: object) => void)(
        this,
        this.constructor,
      );
    }
  }
}

export class InvalidAccountIdError extends DomainError {
  public override readonly code = "INVALID_ACCOUNT_ID" as const;
  constructor(message: string) {
    super(message);
  }
}

export class InvalidCredentialIdError extends DomainError {
  public override readonly code = "INVALID_CREDENTIAL_ID" as const;
  constructor(message: string) {
    super(message);
  }
}

export class InvalidEmailError extends DomainError {
  public override readonly code = "INVALID_EMAIL" as const;
  constructor(message: string) {
    super(message);
  }
}

export class InvalidConfigurationError extends DomainError {
  public override readonly code = "INVALID_CONFIGURATION" as const;
  constructor(message: string) {
    super(message);
  }
}

export class InvalidCredentialError extends DomainError {
  public override readonly code = "INVALID_CREDENTIAL" as const;
  constructor(message: string) {
    super(message);
  }
}

export class AccountAlreadyExistsError extends DomainError {
  public override readonly code = "ACCOUNT_ALREADY_EXISTS" as const;
  constructor() {
    super("An account with this email already exists.");
  }
}

export class AccountNotFoundError extends DomainError {
  public override readonly code = "ACCOUNT_NOT_FOUND" as const;
  constructor(id: string) {
    super(`Account '${id}' not found.`);
  }
}

export class WrongCredentialTypeError extends DomainError {
  public override readonly code = "WRONG_CREDENTIAL_TYPE" as const;
  constructor(expected: string, actual: string) {
    super(`Expected ${expected} credential, but got ${actual}.`);
  }
}

export class AuthenticationError extends DomainError {
  public override readonly code = "AUTHENTICATION_ERROR" as const;
  constructor(message = "Invalid credentials.") {
    super(message);
  }
}

export class InvalidReceiptError extends DomainError {
  public override readonly code = "INVALID_RECEIPT" as const;
  constructor(message: string) {
    super(message);
  }
}

export class CredentialAlreadyExistsError extends DomainError {
  public override readonly code = "CREDENTIAL_ALREADY_EXISTS" as const;
  constructor() {
    super("Account already has password authentication.");
  }
}

export class OAuthProviderNotFoundError extends DomainError {
  public override readonly code = "OAUTH_PROVIDER_NOT_FOUND" as const;
  constructor(provider: string) {
    super(`OAuth provider '${provider}' is not linked to this account.`);
  }
}

export class CannotRemoveLastCredentialError extends DomainError {
  public override readonly code = "CANNOT_REMOVE_LAST_CREDENTIAL" as const;
  constructor() {
    super(
      "Cannot remove the last authentication method — the account would become inaccessible.",
    );
  }
}

export class UnsupportedAuthMethodError extends DomainError {
  public override readonly code = "UNSUPPORTED_AUTH_METHOD" as const;
  constructor(method: string) {
    super(`No handler registered for auth method: '${method}'.`);
  }
}
