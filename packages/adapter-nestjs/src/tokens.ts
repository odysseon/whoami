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

/**
 * DI token for the receipt verifier used by {@link WhoamiAuthGuard}.
 *
 * The provided value is a {@link VerifyReceiptUseCase} instance constructed
 * internally by {@link WhoamiModule} from the configured {@link ReceiptVerifier} port.
 *
 * @public
 */
export const VERIFY_RECEIPT = "WHOAMI_VERIFY_RECEIPT" as const;
