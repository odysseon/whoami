import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import {
  AccountAlreadyExistsError,
  AuthenticationError,
  DomainError,
  InvalidConfigurationError,
  InvalidEmailError,
  InvalidReceiptError,
} from "@odysseon/whoami-core";
import type { Response } from "express";

/**
 * Maps domain errors from the feature-first core API into HTTP responses.
 */
@Catch(DomainError)
export class WhoamiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("WhoamiCore");

  /**
   * Translates a domain error into an HTTP response.
   *
   * @param exception - The captured domain error.
   * @param host - The NestJS host context.
   */
  public catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = this.mapDomainErrorToHttpStatus(exception);

    if (exception instanceof InvalidConfigurationError) {
      this.logger.error(`[${exception.name}] ${exception.message}`);
    } else {
      this.logger.warn(`[${exception.name}] ${exception.message}`);
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.name,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }

  private mapDomainErrorToHttpStatus(error: DomainError): number {
    if (error instanceof AccountAlreadyExistsError) {
      return HttpStatus.CONFLICT;
    }

    if (
      error instanceof AuthenticationError ||
      error instanceof InvalidReceiptError
    ) {
      return HttpStatus.UNAUTHORIZED;
    }

    if (error instanceof InvalidEmailError) {
      return HttpStatus.BAD_REQUEST;
    }

    if (error instanceof InvalidConfigurationError) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    return HttpStatus.BAD_REQUEST;
  }
}
