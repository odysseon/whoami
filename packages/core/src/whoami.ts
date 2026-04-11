/**
 * `createAuth` — top-level factory that composes core use-cases into a single
 * framework-agnostic auth facade.
 *
 * Overloads narrow the return type to the configured auth methods, eliminating
 * optional chaining at call sites.
 *
 * @example — password + OAuth
 * ```ts
 * import { createAuth } from "@odysseon/whoami-core";
 *
 * const auth = createAuth({
 *   accountRepo,
 *   receiptSigner: new JoseReceiptSigner(joseConfig),
 *   receiptVerifier: new JoseReceiptVerifier(joseConfig),
 *   logger,
 *   generateId: crypto.randomUUID.bind(crypto),
 *   password: { passwordManager, passwordStore },
 *   oauth: { oauthStore },
 * });
 *
 * // Register a new account with password
 * const receipt = await auth.registerWithPassword({
 *   email: "user@example.com",
 *   password: "secure-password"
 * });
 *
 * // Authenticate with password
 * const authReceipt = await auth.authenticateWithPassword({
 *   email: "user@example.com",
 *   password: "secure-password"
 * });
 *
 * // Add password to existing account (requires valid receipt)
 * await auth.addPasswordToAccount(accountId, "new-password");
 *
 * // Update password (requires valid receipt)
 * await auth.updatePassword({
 *   accountId,
 *   currentPassword: "old-password",
 *   newPassword: "new-password"
 * });
 *
 * // OAuth authentication
 * const oauthReceipt = await auth.authenticateWithOAuth({
 *   provider: "google",
 *   code: "auth-code"
 * });
 *
 * // Link OAuth to existing account
 * await auth.linkOAuthToAccount({
 *   receipt: validReceipt,
 *   provider: "google",
 *   code: "auth-code"
 * });
 *
 * // Get available auth methods for an account
 * const methods = await auth.getAccountAuthMethods(accountId);
 *
 * // Remove an auth method
 * await auth.removeAuthMethod(accountId, "password");
 *
 * @packageDocumentation
 */

import { AuthenticateOAuthUseCase } from "./features/authentication/application/authenticate-oauth.usecase.js";
import { AuthenticateWithPasswordUseCase } from "./features/authentication/application/authenticate-password.usecase.js";
import { AddPasswordAuthUseCase } from "./features/authentication/application/add-password-auth.usecase.js";
import { RemoveAuthMethodUseCase } from "./features/authentication/application/remove-auth-method.usecase.js";
import { LinkOAuthToAccountUseCase } from "./features/credentials/application/link-oauth.usecase.js";
import { RegisterWithPasswordUseCase } from "./features/credentials/application/register-password.usecase.js";
import { UpdatePasswordUseCase } from "./features/credentials/application/update-password.usecase.js";
import { IssueReceiptUseCase } from "./features/receipts/application/issue-receipt.usecase.js";
import { VerifyReceiptUseCase } from "./features/receipts/application/verify-receipt.usecase.js";
import type { AccountId } from "./shared/index.js";
import type { AuthMethod } from "./shared/domain/auth-method.js";
import type {
  AuthConfig,
  AuthMethods,
  PasswordAuthConfig,
  OAuthConfig,
  FullAuthMethods,
  PasswordOnlyAuthMethods,
  OAuthOnlyAuthMethods,
} from "./types.js";
import { Receipt } from "./features/receipts/domain/receipt.entity.js";

// ── Overloads ────────────────────────────────────────────────────────────────

/**
 * Both password and OAuth configured — returns {@link FullAuthMethods}.
 * @public
 */
export function createAuth(
  config: AuthConfig & { password: PasswordAuthConfig; oauth: OAuthConfig },
): FullAuthMethods;

/**
 * Only password configured — returns {@link PasswordOnlyAuthMethods}.
 * @public
 */
export function createAuth(
  config: AuthConfig & { password: PasswordAuthConfig; oauth?: undefined },
): PasswordOnlyAuthMethods;

/**
 * Only OAuth configured — returns {@link OAuthOnlyAuthMethods}.
 * @public
 */
export function createAuth(
  config: AuthConfig & { password?: undefined; oauth: OAuthConfig },
): OAuthOnlyAuthMethods;

/**
 * Base overload for unknown configuration — returns {@link AuthMethods}.
 * @public
 */
export function createAuth(config: AuthConfig): AuthMethods;

// ── Implementation ───────────────────────────────────────────────────────────

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

  const issueReceiptUC = new IssueReceiptUseCase({
    signer: receiptSigner,
    ...(tokenLifespanMinutes !== undefined ? { tokenLifespanMinutes } : {}),
  });

  const verifyReceiptUC = new VerifyReceiptUseCase(receiptVerifier);

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

  const removeAuthMethodUC = new RemoveAuthMethodUseCase(
    passwordConfig && oauthConfig
      ? {
          passwordStore: passwordConfig.passwordStore,
          oauthStore: oauthConfig.oauthStore,
        }
      : passwordConfig
        ? { passwordStore: passwordConfig.passwordStore }
        : { oauthStore: oauthConfig!.oauthStore },
  );

  const removeAuthMethod = async (
    accountId: AccountId,
    method: AuthMethod,
    options?: { provider?: string },
  ): Promise<void> =>
    await removeAuthMethodUC.execute({
      accountId,
      method,
      ...(options?.provider !== undefined
        ? { provider: options.provider }
        : {}),
    });

  const base: AuthMethods = { getAccountAuthMethods, removeAuthMethod };

  if (passwordConfig) {
    const { passwordManager, passwordStore } = passwordConfig;

    const registerWithPasswordUC = new RegisterWithPasswordUseCase({
      accountFinder: accountRepo,
      accountSaver: accountRepo,
      accountRemover: accountRepo,
      credentialSaver: passwordStore,
      passwordHasher: passwordManager,
      idGenerator: generateId,
      receiptIssuer: issueReceiptUC,
    });

    const authenticateWithPasswordUC = new AuthenticateWithPasswordUseCase({
      accountFinder: accountRepo,
      credentialFinder: passwordStore,
      passwordVerifier: passwordManager,
      receiptIssuer: issueReceiptUC,
      logger,
    });

    const addPasswordUC = new AddPasswordAuthUseCase({
      accountFinder: accountRepo,
      credentialSaver: passwordStore,
      passwordHasher: passwordManager,
      idGenerator: generateId,
      authMethodsProvider: getAccountAuthMethods,
    });

    const updatePasswordUC = new UpdatePasswordUseCase({
      credentialFinder: passwordStore,
      credentialUpdater: passwordStore,
      passwordHasher: passwordManager,
      passwordVerifier: passwordManager,
      receiptVerifier: verifyReceiptUC,
      logger,
    });

    (base as PasswordOnlyAuthMethods).registerWithPassword = async (
      input,
    ): Promise<Receipt> => await registerWithPasswordUC.execute(input);
    (base as PasswordOnlyAuthMethods).authenticateWithPassword = async (
      input,
    ): Promise<Receipt> => await authenticateWithPasswordUC.execute(input);
    (base as PasswordOnlyAuthMethods).addPasswordToAccount = async (
      accountId,
      password,
    ): Promise<void> => await addPasswordUC.execute({ accountId, password });
    (base as PasswordOnlyAuthMethods).updatePassword = async (
      input,
    ): Promise<void> => await updatePasswordUC.execute(input);
  }

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

    (base as OAuthOnlyAuthMethods).authenticateWithOAuth = async (
      input,
    ): Promise<Receipt> => await authenticateOAuthUC.execute(input);
    (base as OAuthOnlyAuthMethods).linkOAuthToAccount = async (
      input,
    ): Promise<void> => await linkOAuthUC.execute(input);
  }

  return base;
}
