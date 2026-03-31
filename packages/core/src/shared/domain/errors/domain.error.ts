/**
 * A stable machine-readable code identifying the error type.
 *
 * Prefer this over `instanceof` checks or string-matching against `message`
 * in consumer error handlers — message text may change, codes will not.
 */
export type DomainErrorCode =
  | "ACCOUNT_ALREADY_EXISTS"
  | "AUTHENTICATION_ERROR"
  | "INVALID_RECEIPT"
  | "WRONG_CREDENTIAL_TYPE"
  | "INVALID_EMAIL"
  | "INVALID_CONFIGURATION"
  | "INVALID_ACCOUNT_ID"
  | "INVALID_CREDENTIAL_ID";

export abstract class DomainError extends Error {
  public readonly code?: DomainErrorCode;

  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
