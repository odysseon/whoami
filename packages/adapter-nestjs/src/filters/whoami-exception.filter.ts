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
  BAD_REQUEST: HttpStatus.BAD_REQUEST,
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
  UNPROCESSABLE: HttpStatus.UNPROCESSABLE_ENTITY,
  INTERNAL: HttpStatus.INTERNAL_SERVER_ERROR,
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
      STATUS_MAP[exception.category] ?? HttpStatus.INTERNAL_SERVER_ERROR;

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
