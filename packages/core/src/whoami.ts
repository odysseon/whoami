/**
 * `createAuth` — top-level factory that composes core use-cases into a single
 * framework-agnostic auth facade.
 *
 * Configure only the sections your application needs. Omitting `password` or
 * `oauth` disables the corresponding methods at runtime (they will be absent
 * on the returned object).
 *
 * @example
 * ```ts
 * import { createAuth } from "@odysseon/whoami-core";
 *
 * const auth = createAuth({
 *   accountRepo,
 *   tokenSigner: issueReceiptUC,
 *   verifyReceipt: verifyReceiptUC,
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

import { AddPasswordAuthUseCase } from "./features/authentication/add-password-auth.usecase.js";
import { AuthenticateOAuthUseCase } from "./features/authentication/authenticate-oauth.usecase.js";
import type { AuthenticateOAuthInput } from "./features/authentication/authenticate-oauth.usecase.js";
import { AuthenticateWithPasswordUseCase } from "./features/authentication/authenticate-password.usecase.js";
import type { LinkOAuthToAccountInput } from "./features/credentials/application/link-oauth.usecase.js";
import { LinkOAuthToAccountUseCase } from "./features/credentials/application/link-oauth.usecase.js";
import { RegisterWithPasswordUseCase } from "./features/credentials/application/register-password.usecase.js";
import { RemovePasswordUseCase } from "./features/credentials/application/remove-password.usecase.js";
import type { Receipt } from "./features/receipts/index.js";
import { CannotRemoveLastCredentialError } from "./shared/domain/errors/auth.error.js";
import type { AccountId } from "./shared/index.js";
import type { AuthConfig, AuthMethod, AuthMethods } from "./types.js";

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
    tokenSigner,
    verifyReceipt,
    logger,
    generateId,
    password: passwordConfig,
    oauth: oauthConfig,
  } = config;

  // ── Auth-method introspection ────────────────────────────────────────────

  const getAccountAuthMethods = async (
    accountId: AccountId,
  ): Promise<AuthMethod[]> => {
    const methods: AuthMethod[] = [];

    if (passwordConfig) {
      const exists =
        await passwordConfig.passwordStore.existsForAccount(accountId);
      if (exists) methods.push("password");
    }

    if (oauthConfig) {
      const exists = await oauthConfig.oauthStore.existsForAccount(accountId);
      if (exists) methods.push("oauth");
    }

    return methods;
  };

  // ── removeAuthMethod ─────────────────────────────────────────────────────

  const removeAuthMethod = async (
    accountId: AccountId,
    method: AuthMethod,
    options?: { provider?: string },
  ): Promise<void> => {
    const activeMethods = await getAccountAuthMethods(accountId);
    if (activeMethods.length <= 1) {
      throw new CannotRemoveLastCredentialError();
    }

    if (method === "password" && passwordConfig) {
      const cred =
        await passwordConfig.passwordStore.findByAccountId(accountId);
      if (cred) {
        const removeUC = new RemovePasswordUseCase({
          passwordStore: passwordConfig.passwordStore,
        });
        await removeUC.execute({ credentialId: String(cred.id.value) });
      }
    }

    if (method === "oauth" && oauthConfig) {
      if (options?.provider) {
        await oauthConfig.oauthStore.deleteByProvider(
          accountId,
          options.provider,
        );
      } else {
        await oauthConfig.oauthStore.deleteAllForAccount(accountId);
      }
    }
  };

  // ── Base facade (always-present methods) ─────────────────────────────────

  const base: AuthMethods = { getAccountAuthMethods, removeAuthMethod };

  // ── Password flow ────────────────────────────────────────────────────────

  if (passwordConfig) {
    const { hashManager, passwordStore } = passwordConfig;

    const registerWithPasswordUC = new RegisterWithPasswordUseCase({
      accountRepo,
      passwordStore,
      hashPassword: (plain: string): Promise<string> => hashManager.hash(plain),
      issueReceipt: tokenSigner,
      generateId,
    });

    const authenticateWithPasswordUC = new AuthenticateWithPasswordUseCase({
      passwordStore,
      passwordManager: hashManager,
      issueReceipt: tokenSigner,
      logger,
    });

    const addPasswordUC = new AddPasswordAuthUseCase({
      passwordStore,
      accountRepo,
      hashManager,
      generateId,
      authMethods: getAccountAuthMethods,
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
  }

  // ── OAuth flow ───────────────────────────────────────────────────────────

  if (oauthConfig) {
    const { oauthStore } = oauthConfig;

    const authenticateOAuthUC = new AuthenticateOAuthUseCase({
      accountRepository: accountRepo,
      oauthCredentialStore: oauthStore,
      issueReceipt: tokenSigner,
      generateId,
      logger,
    });

    const linkOAuthUC = new LinkOAuthToAccountUseCase({
      accountRepository: accountRepo,
      oauthCredentialStore: oauthStore,
      verifyReceipt,
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
