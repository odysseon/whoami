import type { AuthModule } from "../../kernel/ports/auth-module.port.js";
import {
  requirePort,
  requireMethod,
  requireAccountId,
} from "../../kernel/shared/validation.js";
import { buildAuthLifecycle } from "../../kernel/shared/auth-lifecycle.js";
import type {
  PasswordModuleConfig,
  PasswordMethods,
} from "./password.config.js";
import { PasswordProofDeserializer } from "./password.deserializer.js";
import { buildPasswordUseCases } from "./password.factory.js";

export type { PasswordModuleConfig, PasswordMethods };

function validateConfig(config: PasswordModuleConfig): void {
  requireMethod(config.accountRepo, "findByEmail", "accountRepo");
  requireMethod(
    config.passwordHashStore,
    "findByAccountId",
    "passwordHashStore",
  );
  requireMethod(config.resetTokenStore, "findByTokenHash", "resetTokenStore");
  requireMethod(config.passwordHasher, "hash", "passwordHasher");
  requireMethod(config.receiptSigner, "sign", "receiptSigner");
  requirePort(config.idGenerator, "idGenerator");
  requirePort(config.logger, "logger");
  requirePort(config.clock, "clock");
  requireMethod(config.secureToken, "hashToken", "secureToken");
}

/** Creates the password authentication module. */
export function PasswordModule(
  config: PasswordModuleConfig,
): PasswordMethods & AuthModule {
  validateConfig(config);

  const tokenLifespanMinutes = config.tokenLifespanMinutes ?? 60;
  const resetTokenLifespanMinutes = config.resetTokenLifespanMinutes ?? 15;

  const uc = buildPasswordUseCases(
    config,
    tokenLifespanMinutes,
    resetTokenLifespanMinutes,
  );

  const lifecycle = buildAuthLifecycle(config.passwordHashStore);

  return {
    kind: "password",
    proofDeserializer: new PasswordProofDeserializer(),

    registerWithPassword: (input) => uc.register.execute(input),

    authenticateWithPassword: (input) => uc.authenticate.execute(input),

    changePassword: (input) =>
      uc.changePassword.execute({
        accountId: requireAccountId(input.accountId),
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      }),

    addPasswordToAccount: (input) =>
      uc.addPassword.execute({
        accountId: requireAccountId(input.accountId),
        password: input.password,
      }),

    requestPasswordReset: (input) => uc.requestReset.execute(input),

    verifyPasswordReset: (input) => uc.verifyReset.execute(input),

    revokeAllPasswordResets: (input) =>
      uc.revokeAllResets.execute({
        accountId: requireAccountId(input.accountId),
      }),

    ...lifecycle,
  };
}
