import type { ITokenExtractor } from "@odysseon/whoami-core";

type HeaderValue = string | string[] | undefined;

interface HeaderLikeRequest {
  headers?: Record<string, HeaderValue>;
}

function isHeaderLikeRequest(value: unknown): value is HeaderLikeRequest {
  return typeof value === "object" && value !== null;
}

function normalizeHeaderValue(value: HeaderValue): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.find((entry) => typeof entry === "string") ?? null;
  }

  return null;
}

export class BearerTokenExtractor implements ITokenExtractor {
  extract(request: unknown): string | null {
    if (!isHeaderLikeRequest(request)) {
      return null;
    }

    const authorizationHeader = normalizeHeaderValue(
      request.headers?.authorization ?? request.headers?.Authorization,
    );

    if (!authorizationHeader) {
      return null;
    }

    const [scheme, token] = authorizationHeader.split(" ");
    if (!scheme || !token) {
      return null;
    }

    if (scheme.toLowerCase() !== "bearer") {
      return null;
    }

    const trimmedToken = token.trim();
    return trimmedToken === "" ? null : trimmedToken;
  }
}
