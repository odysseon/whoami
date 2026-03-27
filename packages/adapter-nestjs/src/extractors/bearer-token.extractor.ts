import { Injectable } from "@nestjs/common";
import type { AuthTokenExtractor } from "./auth-token-extractor.port.js";

type RequestWithHeaders = {
  headers?: {
    authorization?: string;
  };
};

function hasRequestHeaders(value: unknown): value is RequestWithHeaders {
  return typeof value === "object" && value !== null && "headers" in value;
}

/**
 * Extracts bearer tokens from an HTTP Authorization header.
 */
@Injectable()
export class BearerTokenExtractor implements AuthTokenExtractor {
  /**
   * Extracts a bearer token from the supplied request object.
   *
   * @param request - The incoming request.
   * @returns The bearer token, or `null` when none is present.
   */
  public extract(request: unknown): string | null {
    const authorization = hasRequestHeaders(request)
      ? request.headers?.authorization
      : undefined;
    const [type, token] = authorization?.split(" ") ?? [];

    return type === "Bearer" && token ? token : null;
  }
}
