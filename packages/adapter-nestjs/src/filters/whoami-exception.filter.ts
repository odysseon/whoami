import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { DomainError, DomainErrorCode } from "@odysseon/whoami-core";
import type { Response } from "express";

// ── Status map ────────────────────────────────────────────────────────────────

const HTTP_STATUS_MAP: Record<DomainErrorCode, HttpStatus> = {
  ACCOUNT_ALREADY_EXISTS: HttpStatus.CONFLICT,
  AUTHENTICATION_ERROR: HttpStatus.UNAUTHORIZED,
  INVALID_RECEIPT: HttpStatus.UNAUTHORIZED,
  WRONG_CREDENTIAL_TYPE: HttpStatus.BAD_REQUEST,
  INVALID_EMAIL: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_CONFIGURATION: HttpStatus.INTERNAL_SERVER_ERROR,
  INVALID_ACCOUNT_ID: HttpStatus.BAD_REQUEST,
  INVALID_CREDENTIAL_ID: HttpStatus.BAD_REQUEST,
  INVALID_CREDENTIAL: HttpStatus.BAD_REQUEST,
  ACCOUNT_NOT_FOUND: HttpStatus.NOT_FOUND,
  CREDENTIAL_ALREADY_EXISTS: HttpStatus.CONFLICT,
  OAUTH_PROVIDER_NOT_FOUND: HttpStatus.NOT_FOUND,
  CANNOT_REMOVE_LAST_CREDENTIAL: HttpStatus.UNPROCESSABLE_ENTITY,
  UNSUPPORTED_AUTH_METHOD: HttpStatus.BAD_REQUEST,
};

// ── Filter ────────────────────────────────────────────────────────────────────

/**
 * NestJS exception filter that translates {@link DomainError} instances thrown
 * by `@odysseon/whoami-core` into structured HTTP error responses.
 *
 * Register globally in your `AppModule` or at controller level:
 *
 * ```ts
 * // Global registration (recommended)
 * app.useGlobalFilters(new WhoamiExceptionFilter());
 *
 * // Or as a provider via APP_FILTER
 * { provide: APP_FILTER, useClass: WhoamiExceptionFilter }
 * ```
 *
 * @public
 */
@Catch(DomainError)
export class WhoamiExceptionFilter implements ExceptionFilter<DomainError> {
  private readonly logger = new Logger(WhoamiExceptionFilter.name);

  /**
   * Handles a caught {@link DomainError} and writes the HTTP response.
   *
   * @param exception - The domain error that was thrown.
   * @param host      - The current arguments host.
   */
  public catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      HTTP_STATUS_MAP[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled domain error [${exception.code}]: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.debug(
        `Domain error [${exception.code}]: ${exception.message}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      error: exception.code,
      message: exception.message,
    });
  }
}
