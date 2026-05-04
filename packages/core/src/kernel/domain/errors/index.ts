// Base error
export { DomainError } from "./domain-error.js";

// Error classes
export { AccountAlreadyExistsError } from "./classes/account-already-exists.error.js";
export { AccountNotFoundError } from "./classes/account-not-found.error.js";
export { AuthenticationError } from "./classes/authentication.error.js";
export { WrongCredentialTypeError } from "./classes/wrong-credential-type.error.js";
export { InvalidReceiptError } from "./classes/invalid-receipt.error.js";
export { InvalidEmailError } from "./classes/invalid-email.error.js";
export { InvalidConfigurationError } from "./classes/invalid-configuration.error.js";
export { InvalidCredentialError } from "./classes/invalid-credential.error.js";
export { InvalidAccountIdError } from "./classes/invalid-account-id.error.js";
export { InvalidCredentialIdError } from "./classes/invalid-credential-id.error.js";
export { CredentialAlreadyExistsError } from "./classes/credential-already-exists.error.js";
export { OAuthProviderNotFoundError } from "./classes/oauth-provider-not-found.error.js";
export { CannotRemoveLastCredentialError } from "./classes/cannot-remove-last-credential.error.js";
export { UnsupportedAuthMethodError } from "./classes/unsupported-auth-method.error.js";
export { InvalidResetTokenError } from "./classes/invalid-reset-token.error.js";
export { InvalidMagicLinkError } from "./classes/invalid-magic-link.error.js";
