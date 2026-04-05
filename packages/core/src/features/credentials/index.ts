/**
 * Credentials feature — entities, ports, and use-case exports.
 *
 * @module
 */
export * from "./application/link-oauth.usecase.js";
export * from "./application/register-password.usecase.js";
export * from "./application/remove-password.usecase.js";
export * from "./domain/credential.entity.js";
export * from "./domain/ports/magiclink-credential-store.port.js";
export * from "./domain/ports/oauth-credential-store.port.js";
export * from "./domain/ports/password-credential-store.port.js";
export * from "./domain/ports/password-manager.port.js";
export * from "./domain/ports/token-hasher.port.js";
export * from "./domain/types.js";
