import type { AuthModule } from "../../kernel/ports/auth-module.port.js";
import { createAccountId } from "../../kernel/domain/value-objects/index.js";
import { requirePort, requireMethod } from "../../kernel/shared/validation.js";
import type {
  PasswordModuleConfig,
  PasswordMethods,
} from "./password.config.js";
import { PasswordProofDeserializer } from "./password.deserializer.js";
import { buildPasswordUseCases } from "./password.factory.js";
import {
  buildPasswordLifecycle,
  type PasswordLifecycle,
} from "./password.lifecycle.js";
import type {
  RegisterWithPasswordOutput,
  AuthenticateWithPasswordOutput,
} from "./use-cases/index.js";

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

  const lifecycle: PasswordLifecycle = buildPasswordLifecycle({
    passwordHashStore: config.passwordHashStore,
  });

  return {
    kind: "password",
    proofDeserializer: new PasswordProofDeserializer(),

    registerWithPassword: async (
      input,
    ): Promise<RegisterWithPasswordOutput> => {
      const result = await uc.register.execute(input);
      return { account: result.account };
    },

    authenticateWithPassword: async (
      input,
    ): Promise<AuthenticateWithPasswordOutput> => {
      const result = await uc.authenticate.execute(input);
      return { receipt: result.receipt, account: result.account };
    },

    changePassword: (input) =>
      uc.changePassword.execute({
        accountId: createAccountId(input.accountId),
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      }),

    addPasswordToAccount: (input) =>
      uc.addPassword.execute({
        accountId: createAccountId(input.accountId),
        password: input.password,
      }),

    requestPasswordReset: (input) => uc.requestReset.execute(input),
    verifyPasswordReset: (input) => uc.verifyReset.execute(input),

    revokeAllPasswordResets: (input) =>
      uc.revokeAllResets.execute({
        accountId: createAccountId(input.accountId),
      }),

    ...lifecycle,
  };
}
