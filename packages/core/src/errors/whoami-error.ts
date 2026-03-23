/**
 * Strict, identity-only error codes.
 * Access control or permission errors are strictly forbidden in this domain.
 */
export type WhoamiErrorCode =
  | "USER_NOT_FOUND"
  | "INVALID_CREDENTIALS"
  | "TOKEN_EXPIRED"
  | "TOKEN_MALFORMED"
  | "TOKEN_REUSED"
  | "MISSING_TOKEN"
  | "UNSUPPORTED_AUTH_METHOD";

export class WhoamiError extends Error {
  public readonly code: WhoamiErrorCode;

  constructor(code: WhoamiErrorCode, message: string) {
    super(message);
    this.name = "WhoamiError";
    this.code = code;

    // Maintain proper stack trace for where our error was thrown (V8 specific)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WhoamiError);
    }
  }
}
