import type { PasswordModuleDeps } from "./password.deps.js";

// ─── MODULE CONFIG ───

export interface PasswordModuleConfig extends PasswordModuleDeps {
  readonly tokenLifespanMinutes?: number;
  readonly resetTokenLifespanMinutes?: number;
}

// ─── RE-EXPORTS ───

export type {
  PasswordModuleDeps,
  PasswordResetConfig,
  VerifyPasswordResetConfig,
  RegisterWithPasswordDeps,
  AuthenticateWithPasswordDeps,
  ChangePasswordDeps,
  AddPasswordToAccountDeps,
  RequestPasswordResetDeps,
  VerifyPasswordResetDeps,
  RevokeAllPasswordResetsDeps,
} from "./password.deps.js";

export type { PasswordMethods } from "./password.methods.js";

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
  VerifyPasswordResetInput,
  VerifyPasswordResetOutput,
  RevokeAllPasswordResetsInput,
  RevokeAllPasswordResetsOutput,
} from "./password.types.js";
