/**
 * `@odysseon/whoami-core/oauth` — OAuth authentication module.
 *
 * Import this sub-path to opt in to OAuth auth. Nothing from this
 * module is included in your bundle unless you import it.
 *
 * @example
 * ```ts
 * import { createAuth } from '@odysseon/whoami-core';
 * import { OAuthModule } from '@odysseon/whoami-core/oauth';
 *
 * const auth = createAuth({
 *   accountRepo, receiptSigner, receiptVerifier, logger, idGenerator,
 *   oauth: { oauthStore },
 * });
 * ```
 *
 * @packageDocumentation
 */

// Module object — wire this via createAuth({ oauth: config })
export { OAuthModule } from "../modules/oauth/index.js";

// Config / methods types
export type { OAuthConfig, OAuthMethods } from "../modules/oauth/index.js";

// Ports — implemented by infrastructure adapters
export type { OAuthCredentialStore } from "../modules/oauth/ports/oauth-credential.store.port.js";

// Module-level domain wrapper
export { OAuthCredential } from "../modules/oauth/domain/oauth-credential.entity.js";
