import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { DomainError, InvalidConfigurationError } from "@odysseon/whoami-core";

const STATUS_MAP: Partial<Record<string, HttpStatus>> = {
  AUTHENTICATION_ERROR: HttpStatus.UNAUTHORIZED,
  INVALID_RECEIPT: HttpStatus.UNAUTHORIZED,
  ACCOUNT_ALREADY_EXISTS: HttpStatus.CONFLICT,
  INVALID_EMAIL: HttpStatus.BAD_REQUEST,
  INVALID_CONFIGURATION: HttpStatus.INTERNAL_SERVER_ERROR,
  WRONG_CREDENTIAL_TYPE: HttpStatus.BAD_REQUEST,
  INVALID_ACCOUNT_ID: HttpStatus.BAD_REQUEST,
  INVALID_CREDENTIAL_ID: HttpStatus.BAD_REQUEST,
  INVALID_CREDENTIAL: HttpStatus.BAD_REQUEST,
  ACCOUNT_NOT_FOUND: HttpStatus.NOT_FOUND,
  CREDENTIAL_ALREADY_EXISTS: HttpStatus.CONFLICT,
  OAUTH_PROVIDER_NOT_FOUND: HttpStatus.NOT_FOUND,
  CANNOT_REMOVE_LAST_CREDENTIAL: HttpStatus.UNPROCESSABLE_ENTITY,
  UNSUPPORTED_AUTH_METHOD: HttpStatus.BAD_REQUEST,
};

/**
 * Catches every {@link DomainError} thrown inside NestJS route handlers and
 * maps it to the appropriate HTTP response.
 *
 * Register it globally via `app.useGlobalFilters(new WhoamiExceptionFilter())`
 * or at module level with `APP_FILTER`.
 *
 * @public
 */
@Catch(DomainError)
export class WhoamiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WhoamiExceptionFilter.name);

  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      STATUS_MAP[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof InvalidConfigurationError) {
      this.logger.error(exception.message, exception.stack);
    } else {
      this.logger.warn(exception.message);
    }

    response.status(status).json({
      statusCode: status,
      error: exception.code,
      message: exception.message,
    });
  }
}
