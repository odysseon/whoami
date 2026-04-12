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
  /** The email is already registered — registration rejected. */
  | "ACCOUNT_ALREADY_EXISTS"
  /** Credentials are invalid or the auth flow failed — intentionally vague to prevent enumeration. */
  | "AUTHENTICATION_ERROR"
  /** The receipt token is missing, expired, or the signature is invalid. */
  | "INVALID_RECEIPT"
  /** A proof accessor (`passwordHash`, `oauthProvider`) was called on the wrong credential kind. */
  | "WRONG_CREDENTIAL_TYPE"
  | "INVALID_EMAIL"
  /** A required config value is absent or out of the accepted range (e.g. a non-positive token lifespan). */
  | "INVALID_CONFIGURATION"
  | "INVALID_ACCOUNT_ID"
  | "INVALID_CREDENTIAL_ID"
  /** A credential factory received an empty proof field (hash, provider, or providerId). */
  | "INVALID_CREDENTIAL"
  | "ACCOUNT_NOT_FOUND"
  /** The account already has password auth — only one password credential is allowed. */
  | "CREDENTIAL_ALREADY_EXISTS"
  | "OAUTH_PROVIDER_NOT_FOUND"
  /** Removal was blocked — it would have left the account with no way to authenticate. */
  | "CANNOT_REMOVE_LAST_CREDENTIAL"
  /** The requested auth method has no registered handler in the current config. */
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
