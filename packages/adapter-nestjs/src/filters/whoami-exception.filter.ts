import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { DomainError, InvalidConfigurationError } from "@odysseon/whoami-core";

const STATUS_MAP: Readonly<Record<string, HttpStatus>> = {
  AUTHENTICATION_ERROR: HttpStatus.UNAUTHORIZED,
  INVALID_RECEIPT: HttpStatus.UNAUTHORIZED,
  ACCOUNT_ALREADY_EXISTS: HttpStatus.CONFLICT,
  CREDENTIAL_ALREADY_EXISTS: HttpStatus.CONFLICT,
  INVALID_EMAIL: HttpStatus.BAD_REQUEST,
  WRONG_CREDENTIAL_TYPE: HttpStatus.INTERNAL_SERVER_ERROR,
  INVALID_ACCOUNT_ID: HttpStatus.BAD_REQUEST,
  INVALID_CREDENTIAL_ID: HttpStatus.BAD_REQUEST,
  INVALID_CREDENTIAL: HttpStatus.BAD_REQUEST,
  ACCOUNT_NOT_FOUND: HttpStatus.NOT_FOUND,
  OAUTH_PROVIDER_NOT_FOUND: HttpStatus.NOT_FOUND,
  CANNOT_REMOVE_LAST_CREDENTIAL: HttpStatus.UNPROCESSABLE_ENTITY,
  UNSUPPORTED_AUTH_METHOD: HttpStatus.BAD_REQUEST,
  INVALID_RESET_TOKEN: HttpStatus.BAD_REQUEST,
  INVALID_MAGIC_LINK: HttpStatus.BAD_REQUEST,
  INVALID_CONFIGURATION: HttpStatus.INTERNAL_SERVER_ERROR,
} as const;

@Catch(DomainError)
export class WhoamiExceptionFilter implements ExceptionFilter {
  static {
    // Static block: validate map completeness at class init
    Object.freeze(STATUS_MAP);
  }

  readonly #logger = new Logger(WhoamiExceptionFilter.name);

  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      STATUS_MAP[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;

    // Server-side programmer errors → error level
    if (
      exception instanceof InvalidConfigurationError ||
      exception.code === "WRONG_CREDENTIAL_TYPE"
    ) {
      this.#logger.error(exception.message, exception.stack);
    } else {
      this.#logger.warn(`${exception.code}: ${exception.message}`);
    }

    response.status(status).json({
      statusCode: status,
      error: exception.code,
      message: exception.message,
    });
  }
}
