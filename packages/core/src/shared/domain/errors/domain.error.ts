/**
 * A stable, machine-readable discriminant for every domain error thrown by this library.
 *
 * Consumers should switch on this value instead of performing `instanceof` checks
 * or string-matching against `message` — message text is for humans and may change;
 * codes are part of the public API contract and will not.
 *
 * @public
 */
export type DomainErrorCode =
  /** Emitted when an account with the supplied email already exists. */
  | "ACCOUNT_ALREADY_EXISTS"
  /** Emitted when credentials are invalid or the authentication flow fails. */
  | "AUTHENTICATION_ERROR"
  /** Emitted when a receipt token is missing, expired, or malformed. */
  | "INVALID_RECEIPT"
  /** Emitted when a credential is accessed with the wrong proof type. */
  | "WRONG_CREDENTIAL_TYPE"
  /** Emitted when an email address fails format validation. */
  | "INVALID_EMAIL"
  /** Emitted when a required configuration value is absent or out of range. */
  | "INVALID_CONFIGURATION"
  /** Emitted when an {@link AccountId} value is empty or blank. */
  | "INVALID_ACCOUNT_ID"
  /** Emitted when a {@link CredentialId} value is empty or blank. */
  | "INVALID_CREDENTIAL_ID"
  /** Emitted when a credential proof field (hash, token, provider) is empty. */
  | "INVALID_CREDENTIAL"
  /** Emitted when the requested account does not exist. */
  | "ACCOUNT_NOT_FOUND"
  /** Emitted when a password credential already exists for the account. */
  | "CREDENTIAL_ALREADY_EXISTS"
  /** Emitted when the specified OAuth provider is not linked to the account. */
  | "OAUTH_PROVIDER_NOT_FOUND"
  /** Emitted when removing the last authentication method would lock the account. */
  | "CANNOT_REMOVE_LAST_CREDENTIAL"
  /** Emitted when no handler is registered for the requested auth method. */
  | "UNSUPPORTED_AUTH_METHOD";

/**
 * Base class for all domain errors in `@odysseon/whoami-core`.
 *
 * Every concrete subclass must declare a `readonly code` that narrows to one
 * of the {@link DomainErrorCode} literals.  This allows callers to exhaustively
 * switch on error codes without importing concrete classes.
 *
 * @example
 * ```ts
 * try {
 *   await auth.registerWithPassword(input);
 * } catch (err) {
 *   if (err instanceof DomainError) {
 *     switch (err.code) {
 *       case "ACCOUNT_ALREADY_EXISTS": ...
 *       case "INVALID_EMAIL": ...
 *     }
 *   }
 * }
 * ```
 *
 * @public
 */
export abstract class DomainError extends Error {
  /** The stable discriminant for this error type. */
  public abstract readonly code: DomainErrorCode;

  constructor(message: string) {
    super(message);

    // Restore the prototype chain broken by TypeScript when extending built-ins.
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
