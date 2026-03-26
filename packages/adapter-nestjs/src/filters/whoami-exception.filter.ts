import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { WhoamiError } from "@odysseon/whoami-core";

@Catch(WhoamiError)
export class WhoamiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("WhoamiCore");

  catch(exception: WhoamiError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = this.mapErrorCodeToHttpStatus(exception.code);

    if (exception.code === "INVALID_CONFIGURATION") {
      this.logger.error(`[Configuration Guard] ${exception.message}`);
    } else {
      this.logger.warn(`[${exception.code}] ${exception.message}`);
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.code,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }

  private mapErrorCodeToHttpStatus(code: string): number {
    switch (code) {
      case "INVALID_CREDENTIALS":
      case "TOKEN_MALFORMED":
      case "MISSING_TOKEN":
        return HttpStatus.UNAUTHORIZED;

      case "USER_ALREADY_EXISTS":
        return HttpStatus.CONFLICT;

      case "USER_NOT_FOUND":
        return HttpStatus.NOT_FOUND;

      case "TOKEN_EXPIRED":
      case "TOKEN_REUSED":
        return HttpStatus.GONE;

      case "AUTH_METHOD_DISABLED":
        return HttpStatus.FORBIDDEN;

      case "INVALID_CONFIGURATION":
        return HttpStatus.INTERNAL_SERVER_ERROR;

      default:
        return HttpStatus.BAD_REQUEST;
    }
  }
}
