// Standard password operations
export { RegisterWithPasswordUseCase } from "./register-with-password.use-case.js";
export { AuthenticateWithPasswordUseCase } from "./authenticate-with-password.use-case.js";
export { ChangePasswordUseCase } from "./change-password.use-case.js";
export { AddPasswordToAccountUseCase } from "./add-password-to-account.use-case.js";

// Password recovery operations (INSIDE password module - no orphans!)
export { RequestPasswordResetUseCase } from "./request-password-reset.use-case.js";
export { VerifyPasswordResetUseCase } from "./verify-password-reset.use-case.js";
export { RevokeAllPasswordResetsUseCase } from "./revoke-all-password-resets.use-case.js";

// All types derived from PasswordMethods — import from password.config.ts instead
// These re-exports are for backward compatibility of import paths only
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
} from "../password.config.js";
