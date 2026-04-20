// Module factory and types
export {
  PasswordModule,
  type PasswordModuleConfig,
  type PasswordMethods,
} from "./password.module.js";

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
export type { PasswordCredentialStore, PasswordHasher } from "./ports/index.js";

// Use cases (for advanced users who need direct access)
export {
  RegisterWithPasswordUseCase,
  AuthenticateWithPasswordUseCase,
  ChangePasswordUseCase,
  AddPasswordToAccountUseCase,
  RequestPasswordResetUseCase,
  VerifyPasswordResetUseCase,
  RevokeAllPasswordResetsUseCase,
  type RegisterWithPasswordInput,
  type RegisterWithPasswordOutput,
  type AuthenticateWithPasswordInput,
  type AuthenticateWithPasswordOutput,
  type ChangePasswordInput,
  type ChangePasswordOutput,
  type AddPasswordToAccountInput,
  type AddPasswordToAccountOutput,
  type RequestPasswordResetInput,
  type RequestPasswordResetOutput,
  type PasswordResetConfig,
  type VerifyPasswordResetInput,
  type VerifyPasswordResetOutput,
  type VerifyPasswordResetConfig,
  type RevokeAllPasswordResetsInput,
  type RevokeAllPasswordResetsOutput,
} from "./use-cases/index.js";
