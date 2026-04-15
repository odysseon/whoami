/**
 * `@odysseon/whoami-core/password` — password authentication module.
 *
 * Import this sub-path to opt in to password auth. Nothing from this
 * module is included in your bundle unless you import it.
 *
 * @example
 * ```ts
 * import { createAuth } from '@odysseon/whoami-core';
 * import { PasswordModule } from '@odysseon/whoami-core/password';
 *
 * const auth = createAuth({
 *   accountRepo, receiptSigner, receiptVerifier, logger, idGenerator,
 *   password: { passwordStore, passwordHasher },
 * });
 * ```
 *
 * @packageDocumentation
 */

// Module object — wire this via createAuth({ password: config })
export { PasswordModule } from "../modules/password/index.js";

// Config / methods types
export type {
  PasswordConfig,
  PasswordMethods,
} from "../modules/password/index.js";

// Ports — implemented by infrastructure adapters
export type { PasswordCredentialStore } from "../modules/password/ports/password-credential.store.port.js";
export type { PasswordHasher } from "../modules/password/ports/password-hasher.port.js";

// Module-level domain wrapper
export { PasswordCredential } from "../modules/password/domain/password-credential.entity.js";
