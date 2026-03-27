import { Injectable } from "@nestjs/common";
import type { ITokenExtractor } from "@odysseon/whoami-core";

type RequestWithHeaders = {
  headers?: {
    authorization?: string;
  };
};

function hasRequestHeaders(value: unknown): value is RequestWithHeaders {
  return typeof value === "object" && value !== null && "headers" in value;
}

@Injectable()
export class BearerTokenExtractor implements ITokenExtractor {
  public extract(request: unknown): string | null {
    const authorization = hasRequestHeaders(request)
      ? request.headers?.authorization
      : undefined;
    const [type, token] = authorization?.split(" ") ?? [];

    return type === "Bearer" && token ? token : null;
  }
}
