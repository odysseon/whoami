// Module factory and types
export {
  PasswordModule,
  type PasswordModuleConfig,
  type PasswordMethods,
} from "./password.module.js";

// Unified deps + derived types
export type {
  PasswordModuleDeps,
  RegisterWithPasswordInput,
  RegisterWithPasswordOutput,
  RegisterWithPasswordDeps,
  AuthenticateWithPasswordInput,
  AuthenticateWithPasswordOutput,
  AuthenticateWithPasswordDeps,
  ChangePasswordInput,
  ChangePasswordOutput,
  ChangePasswordDeps,
  AddPasswordToAccountInput,
  AddPasswordToAccountOutput,
  AddPasswordToAccountDeps,
  RequestPasswordResetInput,
  RequestPasswordResetOutput,
  RequestPasswordResetDeps,
  PasswordResetConfig,
  VerifyPasswordResetInput,
  VerifyPasswordResetOutput,
  VerifyPasswordResetDeps,
  VerifyPasswordResetConfig,
  RevokeAllPasswordResetsInput,
  RevokeAllPasswordResetsOutput,
  RevokeAllPasswordResetsDeps,
} from "./password.config.js";

// Entities
export {
  type PasswordHashProof,
  type PasswordResetProof,
  isPasswordHashProof,
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
