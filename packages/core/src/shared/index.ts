/**
 * Shared domain primitives — errors, ports, and value objects.
 *
 * Everything in this barrel is safe to import from any layer of the codebase.
 *
 * @module
 */
export * from "./domain/errors/domain.error.js";
export * from "./domain/errors/account.error.js";
export * from "./domain/errors/auth.error.js";
export * from "./domain/errors/validation.error.js";
export * from "./domain/ports/logger.port.js";
export * from "./domain/value-objects/account-id.vo.js";
export * from "./domain/value-objects/credential-id.vo.js";
export * from "./domain/value-objects/email-address.vo.js";
export * from "./domain/auth-method.js";
