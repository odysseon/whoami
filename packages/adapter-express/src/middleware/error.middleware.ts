import type {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import { DomainError, InvalidConfigurationError } from "@odysseon/whoami-core";

const STATUS_MAP: Readonly<Record<string, number>> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  INTERNAL: 500,
};

export const whoamiErrorHandler = (): ErrorRequestHandler => {
  return (
    err: unknown,
    _req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (err instanceof DomainError) {
      const status = STATUS_MAP[err.category] ?? 500;

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
