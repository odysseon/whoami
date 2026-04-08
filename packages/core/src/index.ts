/**
 * `@odysseon/whoami-core` — framework-agnostic authentication identity kernel.
 *
 * ## Public API
 *
 * Use {@link createAuth} to compose the full auth facade. Ports, entities,
 * errors, and value objects are exported for consumers that need to type
 * against them.
 *
 * ## Internal API (adapter authors only)
 *
 * Concrete use-case classes are available at the `/internal` sub-path:
 *
 * ```ts
 * import { VerifyReceiptUseCase } from "@odysseon/whoami-core/internal";
 * ```
 *
 * Do **not** import use-case classes from this entry point — they are an
 * implementation detail and may change without notice.
 *
 * @packageDocumentation
 */

// ── Shared primitives ──────────────────────────────────────────────────────
export * from "./shared/index.js";

// ── Domain entities ────────────────────────────────────────────────────────
export { Account } from "./features/accounts/domain/account.entity.js";
export type { AccountRepository } from "./features/accounts/domain/account-repository.port.js";
export { Credential } from "./features/credentials/domain/credential.entity.js";
export { Receipt } from "./features/receipts/domain/receipt.entity.js";

// ── Domain ports ───────────────────────────────────────────────────────────
export type { ReceiptSigner } from "./features/receipts/domain/ports/receipt-signer.port.js";
export type { ReceiptVerifier } from "./features/receipts/domain/ports/receipt-verifier.port.js";
export type { PasswordCredentialStore } from "./features/credentials/domain/ports/password-credential-store.port.js";
export type { OAuthCredentialStore } from "./features/credentials/domain/ports/oauth-credential-store.port.js";
export type { PasswordManager } from "./features/credentials/domain/ports/password-manager.port.js";
export type { TokenHasher } from "./features/credentials/domain/ports/token-hasher.port.js";

// ── Input types ────────────────────────────────────────────────────────────
export type { AuthenticateOAuthInput } from "./features/authentication/authenticate-oauth.usecase.js";
export type { LinkOAuthToAccountInput } from "./features/credentials/application/link-oauth.usecase.js";

// ── Credential domain types ────────────────────────────────────────────────
export * from "./features/credentials/domain/types.js";

// ── Factory & facade ───────────────────────────────────────────────────────
export * from "./whoami.js";
export * from "./types.js";
