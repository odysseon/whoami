// Standard password operations
export {
  RegisterWithPasswordUseCase,
  type RegisterWithPasswordInput,
  type RegisterWithPasswordOutput,
} from "./register-with-password.use-case.js";

export {
  AuthenticateWithPasswordUseCase,
  type AuthenticateWithPasswordInput,
  type AuthenticateWithPasswordOutput,
} from "./authenticate-with-password.use-case.js";

export {
  ChangePasswordUseCase,
  type ChangePasswordInput,
  type ChangePasswordOutput,
} from "./change-password.use-case.js";

export {
  AddPasswordToAccountUseCase,
  type AddPasswordToAccountInput,
  type AddPasswordToAccountOutput,
} from "./add-password-to-account.use-case.js";

// Password recovery operations (INSIDE password module - no orphans!)
export {
  RequestPasswordResetUseCase,
  type RequestPasswordResetInput,
  type RequestPasswordResetOutput,
  type PasswordResetConfig,
} from "./request-password-reset.use-case.js";

export {
  VerifyPasswordResetUseCase,
  type VerifyPasswordResetInput,
  type VerifyPasswordResetOutput,
  type VerifyPasswordResetConfig,
} from "./verify-password-reset.use-case.js";

export {
  RevokeAllPasswordResetsUseCase,
  type RevokeAllPasswordResetsInput,
  type RevokeAllPasswordResetsOutput,
} from "./revoke-all-password-resets.use-case.js";
