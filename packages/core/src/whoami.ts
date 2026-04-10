/**
 * `createAuth` — top-level factory that composes core use-cases into a single
 * framework-agnostic auth facade.
 *
 * @example
 * ```ts
 * import { createAuth } from "@odysseon/whoami-core";
 *
 * const auth = createAuth({
 *   accountRepo,
 *   receiptSigner: new JoseReceiptSigner(joseConfig),
 *   receiptVerifier: new JoseReceiptVerifier(joseConfig),
 *   logger,
 *   generateId: crypto.randomUUID.bind(crypto),
 *   password: { hashManager, passwordStore },
 *   oauth: { oauthStore },
 * });
 *
 * const receipt = await auth.registerWithPassword!({ email, password });
 * ```
 *
 * @packageDocumentation
 */

import type { AuthenticateOAuthInput } from "./features/authentication/application/authenticate-oauth.usecase.js";
import { AuthenticateOAuthUseCase } from "./features/authentication/application/authenticate-oauth.usecase.js";
import { AuthenticateWithPasswordUseCase } from "./features/authentication/application/authenticate-password.usecase.js";
import { AddPasswordAuthUseCase } from "./features/authentication/application/add-password-auth.usecase.js";
import { RemoveAuthMethodUseCase } from "./features/authentication/application/remove-auth-method.usecase.js";
import type { LinkOAuthToAccountInput } from "./features/credentials/application/link-oauth.usecase.js";
import { LinkOAuthToAccountUseCase } from "./features/credentials/application/link-oauth.usecase.js";
import { RegisterWithPasswordUseCase } from "./features/credentials/application/register-password.usecase.js";
import { UpdatePasswordUseCase } from "./features/credentials/application/update-password.usecase.js";
import type { Receipt } from "./features/receipts/index.js";
import { IssueReceiptUseCase } from "./features/receipts/application/issue-receipt.usecase.js";
import { VerifyReceiptUseCase } from "./features/receipts/application/verify-receipt.usecase.js";
import type { AccountId } from "./shared/index.js";
import type { AuthMethod } from "./shared/domain/auth-method.js";
import type { AuthConfig, AuthMethods } from "./types.js";

/**
 * Composes the core use-cases and returns the {@link AuthMethods} facade.
 *
 * @param config - {@link AuthConfig}
 * @returns Composed {@link AuthMethods} facade.
 * @public
 */
export function createAuth(config: AuthConfig): AuthMethods {
  const {
    accountRepo,
    receiptSigner,
    receiptVerifier,
    tokenLifespanMinutes,
    logger,
    generateId,
    password: passwordConfig,
    oauth: oauthConfig,
  } = config;

  // ── Build use-cases from ports ───────────────────────────────────────────
  const issueReceiptUC = new IssueReceiptUseCase({
    signer: receiptSigner,
    ...(tokenLifespanMinutes !== undefined ? { tokenLifespanMinutes } : {}),
  });

  const verifyReceiptUC = new VerifyReceiptUseCase(receiptVerifier);

  // ── Auth-method introspection ────────────────────────────────────────────
  const getAccountAuthMethods = async (
    accountId: AccountId,
  ): Promise<AuthMethod[]> => {
    const methods: AuthMethod[] = [];
    if (passwordConfig) {
      if (await passwordConfig.passwordStore.existsForAccount(accountId)) {
        methods.push("password");
      }
    }
    if (oauthConfig) {
      if (await oauthConfig.oauthStore.existsForAccount(accountId)) {
        methods.push("oauth");
      }
    }
    return methods;
  };

  // ── removeAuthMethod — delegates to extracted use-case ───────────────────
  const removeAuthMethodUC = new RemoveAuthMethodUseCase({
    ...(passwordConfig ? { passwordStore: passwordConfig.passwordStore } : {}),
    ...(oauthConfig ? { oauthStore: oauthConfig.oauthStore } : {}),
  });

  const removeAuthMethod = (
    accountId: AccountId,
    method: AuthMethod,
    options?: { provider?: string },
  ): Promise<void> =>
    removeAuthMethodUC.execute({
      accountId,
      method,
      ...(options?.provider !== undefined
        ? { provider: options.provider }
        : {}),
    });

  // ── Base facade ──────────────────────────────────────────────────────────
  const base: AuthMethods = { getAccountAuthMethods, removeAuthMethod };

  // ── Password flow ────────────────────────────────────────────────────────
  if (passwordConfig) {
    const { hashManager, passwordStore } = passwordConfig;

    const registerWithPasswordUC = new RegisterWithPasswordUseCase({
      accountRepo,
      passwordStore,
      hashPassword: (plain: string): Promise<string> => hashManager.hash(plain),
      issueReceipt: issueReceiptUC,
      generateId,
    });

    const authenticateWithPasswordUC = new AuthenticateWithPasswordUseCase({
      passwordStore,
      passwordManager: hashManager,
      issueReceipt: issueReceiptUC,
      logger,
    });

    const addPasswordUC = new AddPasswordAuthUseCase({
      passwordStore,
      accountRepo,
      hashManager,
      generateId,
      authMethods: getAccountAuthMethods,
    });

    const updatePasswordUC = new UpdatePasswordUseCase({
      passwordStore,
      passwordManager: hashManager,
      verifyReceipt: verifyReceiptUC,
      logger,
    });

    base.registerWithPassword = (input: {
      email: string;
      password: string;
    }): Promise<Receipt> => registerWithPasswordUC.execute(input);

    base.authenticateWithPassword = (input: {
      email: string;
      password: string;
    }): Promise<Receipt> => authenticateWithPasswordUC.execute(input);

    base.addPasswordToAccount = (
      accountId: AccountId,
      password: string,
    ): Promise<void> => addPasswordUC.execute({ accountId, password });

    base.updatePassword = (input: {
      receiptToken: string;
      currentPassword: string;
      newPassword: string;
    }): Promise<void> => updatePasswordUC.execute(input);
  }

  // ── OAuth flow ───────────────────────────────────────────────────────────
  if (oauthConfig) {
    const { oauthStore } = oauthConfig;

    const authenticateOAuthUC = new AuthenticateOAuthUseCase({
      accountRepository: accountRepo,
      oauthCredentialStore: oauthStore,
      issueReceipt: issueReceiptUC,
      generateId,
      logger,
    });

    const linkOAuthUC = new LinkOAuthToAccountUseCase({
      accountRepository: accountRepo,
      oauthCredentialStore: oauthStore,
      verifyReceipt: verifyReceiptUC,
      generateId,
      logger,
    });

    base.authenticateWithOAuth = (
      input: AuthenticateOAuthInput,
    ): Promise<Receipt> => authenticateOAuthUC.execute(input);

    base.linkOAuthToAccount = (input: LinkOAuthToAccountInput): Promise<void> =>
      linkOAuthUC.execute(input);
  }

  return base;
}
