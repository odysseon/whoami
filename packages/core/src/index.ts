/**
 * `@odysseon/whoami-core` — framework-agnostic authentication identity kernel.
 *
 * ## Public API
 * Use {@link createAuth} to compose the full auth facade.
 *
 * ## Internal API (adapter authors only)
 * Concrete use-case classes are available at the `/internal` sub-path:
 * ```ts
 * import { VerifyReceiptUseCase } from "@odysseon/whoami-core/internal";
 * ```
 *
 * @packageDocumentation
 */
export * from "./api/public.js";
