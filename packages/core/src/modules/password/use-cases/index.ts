// Use case classes
export { RegisterWithPasswordUseCase } from "./register-with-password.use-case.js";
export { AuthenticateWithPasswordUseCase } from "./authenticate-with-password.use-case.js";
export { ChangePasswordUseCase } from "./change-password.use-case.js";
export { AddPasswordToAccountUseCase } from "./add-password-to-account.use-case.js";
export { RequestPasswordResetUseCase } from "./request-password-reset.use-case.js";
export { VerifyPasswordResetUseCase } from "./verify-password-reset.use-case.js";
export { RevokeAllPasswordResetsUseCase } from "./revoke-all-password-resets.use-case.js";

// All types derived from PasswordMethods — single source of truth
export type {
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
} from "../password.config.js";
