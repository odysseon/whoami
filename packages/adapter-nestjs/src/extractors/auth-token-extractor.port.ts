/**
 * Extracts an authentication token from a transport-specific request.
 *
 * @remarks
 * Declared as an abstract class rather than an interface so that it can serve
 * as a NestJS DI token without requiring a separate string or Symbol constant.
 * This is an intentional adapter-layer pragmatism: consumers outside NestJS
 * should treat this as a pure interface contract.
 *
 * @public
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
