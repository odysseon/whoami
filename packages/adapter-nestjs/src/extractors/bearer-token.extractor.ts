import { Injectable } from "@nestjs/common";
import { AuthTokenExtractor } from "./auth-token-extractor.port.js";

/**
 * Extracts bearer tokens from an HTTP Authorization header.
 */
@Injectable()
export class BearerTokenExtractor extends AuthTokenExtractor {
  readonly #headerName = "authorization";
  readonly #scheme = "Bearer";

  extract(request: unknown): string | null {
    const req = request as {
      headers?: Record<string, string | string[] | undefined>;
    };

    const header = req.headers?.[this.#headerName];
    if (typeof header !== "string") return null;

    const [scheme, token] = header.split(" ");
    return scheme === this.#scheme && token ? token : null;
  }
}
