/**
 * `@odysseon/whoami-core` — public surface.
 *
 * Use {@link createAuth} to compose the full auth facade.
 * Everything below is exported for consumers that need to type against ports,
 * entities, errors, or value objects.
 *
 * ## Deprecation notice (v11.1.0)
 *
 * Module-specific symbols (configs, methods, ports) are now available from
 * dedicated sub-path exports and will be **removed from this barrel in v12**:
 * ```ts
 * // Preferred (tree-shakable):
 * import type { PasswordConfig } from '@odysseon/whoami-core/password';
 * import type { OAuthConfig }    from '@odysseon/whoami-core/oauth';
 * ```
 *
 * @packageDocumentation
 */

// ── Factory ───────────────────────────────────────────────────────────────────
export { createAuth } from "../composition/create-auth.js";
export type {
  AuthConfig,
  AuthMethods,
  AnyAuthMethods,
  CoreAuthMethods,
  AuthMethodKey,
} from "../composition/types.js";
export { hasAuthMethod } from "../composition/types.js";

// ── Kernel entities ───────────────────────────────────────────────────────────
export { Account } from "../kernel/account/account.entity.js";
export { Credential } from "../kernel/credential/credential.entity.js";
export { Receipt } from "../kernel/receipt/receipt.entity.js";

// ── Kernel ports ──────────────────────────────────────────────────────────────
export type { AccountRepository } from "../kernel/account/account.repository.port.js";
export type { ReceiptSigner } from "../kernel/receipt/ports/receipt-signer.port.js";
export type { ReceiptVerifier } from "../kernel/receipt/ports/receipt-verifier.port.js";
export type { LoggerPort } from "../kernel/shared/ports/logger.port.js";
export type { IdGeneratorPort } from "../kernel/shared/ports/id-generator.port.js";
export type { ClockPort } from "../kernel/shared/ports/clock.port.js";

// ── Auth contracts ────────────────────────────────────────────────────────────
export type {
  AuthMethod,
  AuthMethodPort,
} from "../kernel/auth/auth-method.port.js";
export type { AuthResult } from "../kernel/auth/auth-result.type.js";
export { AuthOrchestrator } from "../kernel/auth/auth-orchestrator.js";

// ── Module configs — @deprecated, use sub-path imports in v12 ────────────────
//
// These re-exports remain for backward compatibility but will be removed in
// v12.0.0. Migrate to:
//   import type { PasswordConfig, PasswordMethods, ... } from '@odysseon/whoami-core/password';
//   import type { OAuthConfig, OAuthMethods, ... }       from '@odysseon/whoami-core/oauth';

/** @deprecated Import from `@odysseon/whoami-core/password` instead. Removed in v12. */
export type { PasswordConfig } from "../modules/password/index.js";
/** @deprecated Import from `@odysseon/whoami-core/password` instead. Removed in v12. */
export type { PasswordMethods } from "../modules/password/index.js";
/** @deprecated Import from `@odysseon/whoami-core/oauth` instead. Removed in v12. */
export type { OAuthConfig } from "../modules/oauth/index.js";
/** @deprecated Import from `@odysseon/whoami-core/oauth` instead. Removed in v12. */
export type { OAuthMethods } from "../modules/oauth/index.js";

// ── Module-owned ports — @deprecated, use sub-path imports in v12 ────────────
/** @deprecated Import from `@odysseon/whoami-core/password` instead. Removed in v12. */
export type { PasswordCredentialStore } from "../modules/password/ports/password-credential.store.port.js";
/** @deprecated Import from `@odysseon/whoami-core/password` instead. Removed in v12. */
export type { PasswordHasher } from "../modules/password/ports/password-hasher.port.js";
/** @deprecated Import from `@odysseon/whoami-core/oauth` instead. Removed in v12. */
export type { OAuthCredentialStore } from "../modules/oauth/ports/oauth-credential.store.port.js";

// ── Credential types ──────────────────────────────────────────────────────────
export type {
  CredentialProof,
  PasswordProof,
  OAuthProof,
} from "../kernel/credential/credential.types.js";

// ── Shared primitives ─────────────────────────────────────────────────────────
export { AccountId } from "../kernel/shared/value-objects/account-id.vo.js";
export { CredentialId } from "../kernel/shared/value-objects/credential-id.vo.js";
export { EmailAddress } from "../kernel/shared/value-objects/email-address.vo.js";

// ── Errors ────────────────────────────────────────────────────────────────────
export {
  DomainError,
  AccountAlreadyExistsError,
  AccountNotFoundError,
  AuthenticationError,
  InvalidReceiptError,
  WrongCredentialTypeError,
  InvalidEmailError,
  InvalidConfigurationError,
  InvalidCredentialError,
  InvalidAccountIdError,
  InvalidCredentialIdError,
  CredentialAlreadyExistsError,
  OAuthProviderNotFoundError,
  CannotRemoveLastCredentialError,
  UnsupportedAuthMethodError,
} from "../kernel/shared/errors/domain.error.js";
export type { DomainErrorCode } from "../kernel/shared/errors/domain.error.js";
