/**
 * DI token for the {@link AuthMethods} facade produced by {@link createAuth}.
 *
 * Inject it to call auth methods directly in your own services:
 *
 * ```ts
 * constructor(@Inject(AUTH_METHODS) private readonly auth: AuthMethods) {}
 * ```
 *
 * @public
 */
export const AUTH_METHODS = "WHOAMI_AUTH_METHODS" as const;
