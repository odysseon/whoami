import type { AccountId } from "../../kernel/domain/value-objects/index.js";
import type { PasswordMethods } from "./password.methods.js";

export type RegisterWithPasswordInput = Parameters<
  PasswordMethods["registerWithPassword"]
>[0];
export type RegisterWithPasswordOutput = Awaited<
  ReturnType<PasswordMethods["registerWithPassword"]>
>;

export type AuthenticateWithPasswordInput = Parameters<
  PasswordMethods["authenticateWithPassword"]
>[0];
export type AuthenticateWithPasswordOutput = Awaited<
  ReturnType<PasswordMethods["authenticateWithPassword"]>
>;

export type ChangePasswordInput = {
  readonly accountId: AccountId;
  readonly currentPassword: string;
  readonly newPassword: string;
};

export type ChangePasswordOutput = Awaited<
  ReturnType<PasswordMethods["changePassword"]>
>;

export type AddPasswordToAccountInput = {
  readonly accountId: AccountId;
  readonly password: string;
};

export type AddPasswordToAccountOutput = Awaited<
  ReturnType<PasswordMethods["addPasswordToAccount"]>
>;

export type RequestPasswordResetInput = Parameters<
  PasswordMethods["requestPasswordReset"]
>[0];
export type RequestPasswordResetOutput = NonNullable<
  Awaited<ReturnType<PasswordMethods["requestPasswordReset"]>>
>;

export type VerifyPasswordResetInput = Parameters<
  PasswordMethods["verifyPasswordReset"]
>[0];
export type VerifyPasswordResetOutput = Awaited<
  ReturnType<PasswordMethods["verifyPasswordReset"]>
>;

export type RevokeAllPasswordResetsInput = {
  readonly accountId: AccountId;
};

export type RevokeAllPasswordResetsOutput = Awaited<
  ReturnType<PasswordMethods["revokeAllPasswordResets"]>
>;
