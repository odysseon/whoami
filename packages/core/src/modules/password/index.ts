// Module factory and types
export {
  PasswordModule,
  type PasswordModuleConfig,
  type PasswordMethods,
} from "./password.module.js";

// Derived types (single source of truth lives in password.config.ts)
export type {
  RegisterWithPasswordInput,
  RegisterWithPasswordOutput,
  AuthenticateWithPasswordInput,
  AuthenticateWithPasswordOutput,
  ChangePasswordInput,
  ChangePasswordOutput,
  AddPasswordToAccountInput,
  AddPasswordToAccountOutput,
  RequestPasswordResetInput,
  RequestPasswordResetOutput,
  PasswordResetConfig,
  VerifyPasswordResetInput,
  VerifyPasswordResetOutput,
  VerifyPasswordResetConfig,
  RevokeAllPasswordResetsInput,
  RevokeAllPasswordResetsOutput,
} from "./password.config.js";

// Entities
export {
  type PasswordProof,
  type PasswordHashProof,
  type PasswordResetProof,
  isPasswordHashProof,
  isPasswordResetProof,
  createPasswordHashProof,
  createPasswordResetProof,
  markResetProofAsUsed,
  isResetProofExpired,
  isResetProofUsed,
} from "./entities/password.proof.js";

// Ports
export type {
  PasswordHashStore,
  PasswordResetTokenStore,
  PasswordHasher,
} from "./ports/index.js";

// Use cases (for advanced users / DI wiring)
export {
  RegisterWithPasswordUseCase,
  AuthenticateWithPasswordUseCase,
  ChangePasswordUseCase,
  AddPasswordToAccountUseCase,
  RequestPasswordResetUseCase,
  VerifyPasswordResetUseCase,
  RevokeAllPasswordResetsUseCase,
} from "./use-cases/index.js";
