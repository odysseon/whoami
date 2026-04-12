import type { AuthModule } from "../auth-module.interface.js";
import type { CoreContext } from "../core-context.js";
import type { PasswordAuthConfig, PasswordAuthMethods } from "../../types.js";
import type { AuthMethodsProvider } from "../../shared/index.js";

import { RegisterWithPasswordUseCase } from "../../features/credentials/application/register-password.usecase.js";
import { AuthenticateWithPasswordUseCase } from "../../features/authentication/application/authenticate-password.usecase.js";
import { AddPasswordAuthUseCase } from "../../features/authentication/application/add-password-auth.usecase.js";
import { UpdatePasswordUseCase } from "../../features/credentials/application/update-password.usecase.js";

import type { RegisterWithPasswordInput } from "../../features/credentials/application/register-password.usecase.js";
import type { AuthenticateWithPasswordInput } from "../../features/authentication/application/authenticate-password.usecase.js";
import type { AddPasswordAuthInput } from "../../features/authentication/application/add-password-auth.usecase.js";
import type { UpdatePasswordInput } from "../../features/credentials/application/update-password.usecase.js";
import type { Receipt } from "../../features/receipts/index.js";

/**
 * Self-contained password authentication module.
 *
 * Wires all password-related use-cases from `PasswordAuthConfig` +
 * {@link CoreContext} and exposes the {@link PasswordAuthMethods} surface.
 *
 * @public
 */
export const PasswordModule: AuthModule<
  PasswordAuthConfig,
  PasswordAuthMethods
> = {
  key: "password",

  create(config: PasswordAuthConfig, ctx: CoreContext): PasswordAuthMethods {
    const { passwordManager, passwordStore } = config;
    const { accountRepo, issueReceipt, verifyReceipt, logger, generateId } =
      ctx;

    // ── Shared authMethodsProvider (consumed by AddPasswordAuthUseCase) ──

    const authMethodsProvider: AuthMethodsProvider = async (accountId) => {
      const methods: import("../../shared/domain/auth-method.js").AuthMethod[] =
        [];
      if (await passwordStore.existsForAccount(accountId)) {
        methods.push("password");
      }
      return methods;
    };

    // ── Use-case instantiation ────────────────────────────────────────────

    const registerUC = new RegisterWithPasswordUseCase({
      accountFinder: accountRepo,
      accountSaver: accountRepo,
      accountRemover: accountRepo,
      credentialSaver: passwordStore,
      passwordHasher: passwordManager,
      idGenerator: generateId,
      receiptIssuer: issueReceipt,
    });

    const authenticateUC = new AuthenticateWithPasswordUseCase({
      accountFinder: accountRepo,
      credentialFinder: passwordStore,
      receiptIssuer: issueReceipt,
      logger,
      passwordVerifier: passwordManager,
    });

    const addPasswordUC = new AddPasswordAuthUseCase({
      accountFinder: accountRepo,
      credentialSaver: passwordStore,
      passwordHasher: passwordManager,
      idGenerator: generateId,
      authMethodsProvider,
    });

    const updatePasswordUC = new UpdatePasswordUseCase({
      credentialFinder: passwordStore,
      credentialUpdater: passwordStore,
      passwordHasher: passwordManager,
      passwordVerifier: passwordManager,
      receiptVerifier: verifyReceipt,
      logger,
    });

    // ── Public method surface ─────────────────────────────────────────────

    return {
      registerWithPassword: (
        input: RegisterWithPasswordInput,
      ): Promise<Receipt> => registerUC.execute(input),

      authenticateWithPassword: (
        input: AuthenticateWithPasswordInput,
      ): Promise<Receipt> => authenticateUC.execute(input),

      addPasswordToAccount: (input: AddPasswordAuthInput): Promise<void> =>
        addPasswordUC.execute(input),

      updatePassword: (input: UpdatePasswordInput): Promise<void> =>
        updatePasswordUC.execute(input),
    };
  },
};
