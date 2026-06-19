import type {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import { DomainError, InvalidConfigurationError } from "@odysseon/whoami-core";

const STATUS_MAP: Readonly<Record<string, number>> = {
  AUTHENTICATION_ERROR: 401,
  INVALID_RECEIPT: 401,
  ACCOUNT_ALREADY_EXISTS: 409,
  CREDENTIAL_ALREADY_EXISTS: 409,
  INVALID_EMAIL: 400,
  WRONG_CREDENTIAL_TYPE: 500,
  INVALID_ACCOUNT_ID: 400,
  INVALID_CREDENTIAL_ID: 400,
  INVALID_CREDENTIAL: 400,
  ACCOUNT_NOT_FOUND: 404,
  OAUTH_PROVIDER_NOT_FOUND: 404,
  CANNOT_REMOVE_LAST_CREDENTIAL: 422,
  UNSUPPORTED_AUTH_METHOD: 400,
  INVALID_RESET_TOKEN: 400,
  INVALID_MAGIC_LINK: 400,
  INVALID_CONFIGURATION: 500,
};

export const whoamiErrorHandler = (): ErrorRequestHandler => {
  return (
    err: unknown,
    _req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (err instanceof DomainError) {
      const status = STATUS_MAP[err.code] ?? 500;

      if (
        err instanceof InvalidConfigurationError ||
        err.code === "WRONG_CREDENTIAL_TYPE"
      ) {
        console.error(err.message, err.stack);
      } else {
        console.warn(`${err.code}: ${err.message}`);
      }

      res.status(status).json({
        statusCode: status,
        error: err.code,
        message: err.message,
      });
      return;
    }

    next(err);
  };
};
