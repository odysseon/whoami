import type { AuthModule } from "../module.interface.js";
import type { AuthMethodPort } from "../../kernel/auth/auth-method.port.js";
import type { AuthMethodRemover } from "../../kernel/auth/usecases/remove-auth-method.usecase.js";
import type { CoreContext } from "../../composition/context-builder.js";
import type { PasswordCredentialStore } from "./ports/password-credential.store.port.js";
import type { PasswordHasher } from "./ports/password-hasher.port.js";
import type { AccountId } from "../../kernel/shared/index.js";
import type { Receipt } from "../../kernel/receipt/receipt.entity.js";
import type { ProofDeserializer } from "../../kernel/credential/composite-deserializer.js";
import { PasswordProof } from "../../kernel/credential/credential.types.js";

import { RegisterWithPasswordUseCase } from "./usecases/register.usecase.js";
import { AuthenticateWithPasswordUseCase } from "./usecases/authenticate.usecase.js";
import { AddPasswordUseCase } from "./usecases/add-password.usecase.js";
import { ChangePasswordUseCase } from "./usecases/change-password.usecase.js";

export interface PasswordConfig {
  passwordStore: PasswordCredentialStore;
  passwordHasher: PasswordHasher;
}

export interface PasswordMethods {
  registerWithPassword(input: {
    email: string;
    password: string;
  }): Promise<Receipt>;
  authenticateWithPassword(input: {
    email: string;
    password: string;
  }): Promise<Receipt>;
  addPasswordToAccount(input: {
    accountId: AccountId;
    password: string;
  }): Promise<void>;
  changePassword(input: {
    receiptToken: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<void>;
}

export const PasswordModule: AuthModule<PasswordConfig, PasswordMethods> = {
  key: "password",

  create(config: PasswordConfig, ctx: CoreContext): PasswordMethods {
    const { passwordStore, passwordHasher } = config;
    const { accountRepo, issueReceipt, verifyReceipt, logger, idGenerator } =
      ctx;

    const registerUC = new RegisterWithPasswordUseCase({
      accountFinder: accountRepo,
      accountSaver: accountRepo,
      accountRemover: accountRepo,
      credentialSaver: passwordStore,
      passwordHasher,
      idGenerator,
      receiptIssuer: issueReceipt,
    });

    const authenticateUC = new AuthenticateWithPasswordUseCase({
      accountFinder: accountRepo,
      credentialFinder: passwordStore,
      receiptIssuer: issueReceipt,
      passwordVerifier: passwordHasher,
      logger,
    });

    const addPasswordUC = new AddPasswordUseCase({
      accountFinder: accountRepo,
      credentialChecker: passwordStore,
      credentialSaver: passwordStore,
      passwordHasher,
      idGenerator,
    });

    const changePasswordUC = new ChangePasswordUseCase({
      credentialFinder: passwordStore,
      credentialUpdater: passwordStore,
      passwordHasher,
      receiptVerifier: verifyReceipt,
      logger,
    });

    return {
      registerWithPassword: (input): Promise<Receipt> =>
        registerUC.execute(input),
      authenticateWithPassword: (input): Promise<Receipt> =>
        authenticateUC.execute(input),
      addPasswordToAccount: (input): Promise<void> =>
        addPasswordUC.execute(input),
      changePassword: (input): Promise<void> => changePasswordUC.execute(input),
    };
  },

  /**
   * Exposes the password store as an {@link AuthMethodPort} so the kernel can
   * query credential existence without importing the store directly.
   */
  buildAuthMethodPort(config: PasswordConfig): AuthMethodPort {
    return {
      method: "password",
      exists: (accountId): Promise<boolean> =>
        config.passwordStore.existsForAccount(accountId),
      count: async (accountId): Promise<1 | 0> =>
        (await config.passwordStore.existsForAccount(accountId)) ? 1 : 0,
    };
  },

  buildAuthMethodRemover(config: PasswordConfig): AuthMethodRemover {
    return {
      method: "password",
      remove: async (accountId): Promise<void> => {
        const cred = await config.passwordStore.findByAccountId(accountId);
        if (cred) await config.passwordStore.delete(cred.id);
      },
    };
  },

  proofDeserializer: ((raw: string): PasswordProof | null => {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed !== null &&
        typeof parsed === "object" &&
        "kind" in parsed &&
        (parsed as Record<string, unknown>)["kind"] === "password" &&
        "hash" in parsed &&
        typeof (parsed as Record<string, unknown>)["hash"] === "string"
      ) {
        const hash = (parsed as Record<string, unknown>)["hash"];
        if (typeof hash !== "string") return null;
        return new PasswordProof(hash);
      }
    } catch {
      // not JSON or wrong shape — not ours
    }
    return null;
  }) satisfies ProofDeserializer,
};
