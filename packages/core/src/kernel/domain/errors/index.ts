export { DomainError } from "./domain-error.js";

import { DomainError } from "./domain-error.js";

/**
 * Thrown when attempting to register an email that already has an account
 */
export class AccountAlreadyExistsError extends DomainError {
  readonly code = "ACCOUNT_ALREADY_EXISTS";
  readonly statusCode = 409;

  constructor(email: string) {
    super(`Account already exists for email: ${email}`);
  }
}

/**
 * Thrown when a use case looks up an account by ID and finds none
 */
export class AccountNotFoundError extends DomainError {
  readonly code = "ACCOUNT_NOT_FOUND";
  readonly statusCode = 404;

  constructor(accountId: string) {
    super(`Account not found: ${accountId}`);
  }
}

/**
 * Thrown when credential verification fails
 * Intentionally vague to prevent enumeration attacks
 */
export class AuthenticationError extends DomainError {
  readonly code = "AUTHENTICATION_ERROR";
  readonly statusCode = 401;

  constructor(message: string = "Authentication failed") {
    super(message);
  }
}

/**
 * Thrown when accessing a proof field that doesn't match the credential's kind
 */
export class WrongCredentialTypeError extends DomainError {
  readonly code = "WRONG_CREDENTIAL_TYPE";
  readonly statusCode = 500;

  constructor(expected: string, actual: string) {
    super(`Expected credential kind '${expected}' but got '${actual}'`);
  }
}

/**
 * Thrown when receipt token is empty, expired, or fails signature verification
 */
export class InvalidReceiptError extends DomainError {
  readonly code = "INVALID_RECEIPT";
  readonly statusCode = 401;

  constructor(message: string = "Invalid receipt") {
    super(message);
  }
}

/**
 * Thrown when constructing EmailAddress with an invalid value
 */
export class InvalidEmailError extends DomainError {
  readonly code = "INVALID_EMAIL";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Thrown when a use case is constructed with an invalid config value
 */
export class InvalidConfigurationError extends DomainError {
  readonly code = "INVALID_CONFIGURATION";
  readonly statusCode = 500;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Thrown when a credential factory receives an empty proof field
 */
export class InvalidCredentialError extends DomainError {
  readonly code = "INVALID_CREDENTIAL";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Thrown when constructing AccountId with an empty value
 */
export class InvalidAccountIdError extends DomainError {
  readonly code = "INVALID_ACCOUNT_ID";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Thrown when constructing CredentialId with an empty value
 */
export class InvalidCredentialIdError extends DomainError {
  readonly code = "INVALID_CREDENTIAL_ID";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Thrown when attempting to add a password to an account that already has one
 */
export class CredentialAlreadyExistsError extends DomainError {
  readonly code = "CREDENTIAL_ALREADY_EXISTS";
  readonly statusCode = 409;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Thrown when removing an OAuth provider that is not linked to the account
 */
export class OAuthProviderNotFoundError extends DomainError {
  readonly code = "OAUTH_PROVIDER_NOT_FOUND";
  readonly statusCode = 404;

  constructor(provider: string) {
    super(`OAuth provider not found: ${provider}`);
  }
}

/**
 * Thrown when removing the last auth method would lock the account permanently
 */
export class CannotRemoveLastCredentialError extends DomainError {
  readonly code = "CANNOT_REMOVE_LAST_CREDENTIAL";
  readonly statusCode = 400;

  constructor() {
    super("Cannot remove the last credential from an account");
  }
}

/**
 * Thrown when removeAuthMethod is called for a method that is not configured
 */
export class UnsupportedAuthMethodError extends DomainError {
  readonly code = "UNSUPPORTED_AUTH_METHOD";
  readonly statusCode = 400;

  constructor(method: string) {
    super(`Unsupported authentication method: ${method}`);
  }
}

/**
 * Thrown when a password reset token is invalid or expired
 */
export class InvalidResetTokenError extends DomainError {
  readonly code = "INVALID_RESET_TOKEN";
  readonly statusCode = 400;

  constructor(message: string = "Invalid or expired reset token") {
    super(message);
  }
}

/**
 * Thrown when a magic link token is invalid or expired
 */
export class InvalidMagicLinkError extends DomainError {
  readonly code = "INVALID_MAGIC_LINK";
  readonly statusCode = 400;

  constructor(message: string = "Invalid or expired magic link") {
    super(message);
  }
}
