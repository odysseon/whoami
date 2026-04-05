import { DomainError } from "./domain.error.js";

/**
 * Thrown when a credential is accessed with a proof accessor that does not
 * match its actual proof kind.
 *
 * @example
 * ```ts
 * // Accessing `.passwordHash` on an OAuth credential throws this.
 * credential.passwordHash; // throws WrongCredentialTypeError
 * ```
 *
 * @public
 */
export class WrongCredentialTypeError extends DomainError {
  public override readonly code = "WRONG_CREDENTIAL_TYPE" as const;

  /**
   * @param expected - The proof kind the caller expected (e.g. `"password"`).
   * @param actual   - The proof kind the credential actually holds.
   */
  constructor(expected: string, actual: string) {
    super(`Expected ${expected} credential, but got ${actual}.`);
  }
}

/**
 * Thrown when authentication fails for any reason that must not leak specifics
 * to the caller (invalid credentials, account not linked, etc.).
 *
 * Use the optional `message` parameter only for internal/logging purposes;
 * the default message is intentionally vague to prevent user enumeration.
 *
 * @public
 */
export class AuthenticationError extends DomainError {
  public override readonly code = "AUTHENTICATION_ERROR" as const;

  /** @param message - Optional override; defaults to a generic "Invalid credentials." */
  constructor(message: string = "Invalid credentials.") {
    super(message);
  }
}

/**
 * Thrown when a receipt token is absent, empty, expired, or fails signature
 * verification.
 *
 * @public
 */
export class InvalidReceiptError extends DomainError {
  public override readonly code = "INVALID_RECEIPT" as const;

  /** @param message - Human-readable description of what was wrong with the receipt. */
  constructor(message: string) {
    super(message);
  }
}

/**
 * Thrown when a password credential already exists for the account and the
 * caller attempts to add a second one.
 *
 * @public
 */
export class CredentialAlreadyExistsError extends DomainError {
  public override readonly code = "CREDENTIAL_ALREADY_EXISTS" as const;

  constructor() {
    super("Account already has password authentication.");
  }
}

/**
 * Thrown when a caller attempts to remove an OAuth provider that is not linked
 * to the account.
 *
 * @public
 */
export class OAuthProviderNotFoundError extends DomainError {
  public override readonly code = "OAUTH_PROVIDER_NOT_FOUND" as const;

  /** @param provider - The provider name that was not found (e.g. `"google"`). */
  constructor(provider: string) {
    super(`OAuth provider '${provider}' is not linked to this account.`);
  }
}

/**
 * Thrown when an operation would remove the last authentication method from an
 * account, leaving it permanently inaccessible.
 *
 * @public
 */
export class CannotRemoveLastCredentialError extends DomainError {
  public override readonly code = "CANNOT_REMOVE_LAST_CREDENTIAL" as const;

  constructor() {
    super(
      "Cannot remove the last authentication method — the account would become inaccessible.",
    );
  }
}

/**
 * Thrown when `removeAuthMethod` is called for an auth method that has no
 * registered handler (i.e. the method was never configured in {@link AuthConfig}).
 *
 * @public
 */
export class UnsupportedAuthMethodError extends DomainError {
  public override readonly code = "UNSUPPORTED_AUTH_METHOD" as const;

  /** @param method - The auth method string that has no handler. */
  constructor(method: string) {
    super(`No handler registered for auth method: '${method}'.`);
  }
}
