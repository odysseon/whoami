/**
 * Extracts an authentication token from a transport-specific request.
 */
export abstract class AuthTokenExtractor {
  /**
   * Extracts an authentication token from the supplied request object.
   *
   * @param request - The transport-specific request.
   * @returns The extracted token, or `null` when none is present.
   */
  abstract extract(request: unknown): string | null;
}
