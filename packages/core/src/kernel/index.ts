// Domain entities
export {
  Account,
  Receipt,
  Credential,
  type CredentialProof,
  type AccountProps,
} from "./domain/entities/index.js";

// Domain value objects
export {
  type AccountId,
  type EmailAddress,
  type CredentialId,
  createAccountId,
  createEmailAddress,
  createCredentialId,
  isAccountId,
  isEmailAddress,
  isCredentialId,
} from "./domain/value-objects/index.js";

// Domain errors
export {
  DomainError,
  AccountAlreadyExistsError,
  AccountNotFoundError,
  AuthenticationError,
  WrongCredentialTypeError,
  InvalidReceiptError,
  InvalidEmailError,
  InvalidConfigurationError,
  InvalidCredentialError,
  InvalidAccountIdError,
  InvalidCredentialIdError,
  CredentialAlreadyExistsError,
  OAuthProviderNotFoundError,
  CannotRemoveLastCredentialError,
  UnsupportedAuthMethodError,
  InvalidResetTokenError,
  InvalidMagicLinkError,
} from "./domain/errors/index.js";

// Ports (interfaces)
export type {
  AccountRepository,
  ReceiptSigner,
  ReceiptVerifier,
  LoggerPort,
  IdGeneratorPort,
  ClockPort,
  AuthModule,
  CredentialProofDeserializer,
  SecureTokenPort,
  CredentialStoreBase,
} from "./ports/index.js";

// Shared utilities
export {
  CompositeDeserializer,
  AuthOrchestrator,
  buildAuthLifecycle,
  type AuthLifecycle,
} from "./shared/index.js";

// DTO types derived from entities — shared across all modules
export type { AccountDTO } from "./domain/entities/account.js";
export type { ReceiptDTO } from "./domain/entities/receipt.js";
