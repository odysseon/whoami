/**
 * Contract for extracting an authentication token from an incoming request.
 */
export interface ITokenExtractor {
  /**
   * The request is typed as `unknown` to strictly forbid coupling
   * the core library to Express, Fastify, or native Node Request objects.
   * * @returns The raw token string, or null if no token is found.
   */
  extract(request: unknown): string | null;
}
