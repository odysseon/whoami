import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { WhoamiError } from "@odysseon/whoami-core";

export function mapWhoamiError(error: WhoamiError): Error {
  switch (error.code) {
    case "USER_ALREADY_EXISTS":
      return new ConflictException(error.message);
    case "INVALID_CONFIGURATION":
    case "AUTH_METHOD_DISABLED":
    case "USER_NOT_FOUND":
      return new BadRequestException(error.message);
    case "MISSING_TOKEN":
    case "INVALID_CREDENTIALS":
    case "TOKEN_EXPIRED":
    case "TOKEN_MALFORMED":
    case "TOKEN_REUSED":
    case "UNSUPPORTED_AUTH_METHOD":
      return new UnauthorizedException(error.message);
    default:
      return new UnauthorizedException(error.message);
  }
}
