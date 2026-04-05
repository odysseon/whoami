import {
  AddPasswordAuthUseCase,
  AuthenticateOAuthUseCase,
  AuthenticateWithPasswordUseCase,
} from "./features/authentication/index.js";
import { LinkOAuthToAccountUseCase } from "./features/credentials/application/link-oauth.usecase.js";
import { RegisterWithPasswordUseCase } from "./features/credentials/application/register-password.usecase.js";
import { Receipt } from "./features/receipts/index.js";
import { AccountId } from "./shared/index.js";
import {
  CannotRemoveLastCredentialError,
  OAuthProviderNotFoundError,
  UnsupportedAuthMethodError,
} from "./shared/domain/errors/auth.error.js";
import { AuthConfig, AuthMethod, AuthMethods } from "./types.js";

/**
 * A handler that removes a specific auth method for a given account.
 * @internal
 */
type RemoveHandler = (
  accountId: AccountId,
  options?: { provider?: string },
) => Promise<void>;

/**
 * A plugin that attaches optional auth-method behaviour to the {@link AuthMethods} surface.
 * @internal
 */
type AuthPlugin = (
  methods: AuthMethods,
  config: AuthConfig,
  removeHandlers: Partial<Record<AuthMethod, RemoveHandler>>,
) => void;

/**
 * Assembles an {@link AuthMethods} instance from the supplied {@link AuthConfig}.
 *
 * Only the sections present in `config` are activated:
 * - `config.password` → enables password registration, login, and management.
 * - `config.oauth`    → enables OAuth login, linking, and management.
 *
 * @example
 * ```ts
 * const auth = createAuth({
 *   accountRepo,
 *   tokenSigner: issueReceiptUseCase,
 *   verifyReceipt: verifyReceiptUseCase,
 *   logger: console,
 *   generateId: () => crypto.randomUUID(),
 *   password: { hashManager, passwordStore },
 *   oauth: { oauthStore },
 * });
 *
 * const receipt = await auth.registerWithPassword!({ email, password });
 * ```
 *
 * @param config - {@link AuthConfig}
 * @returns The assembled {@link AuthMethods} API surface.
 *
 * @public
 */
export function createAuth(config: AuthConfig): AuthMethods {
  const removeHandlers: Partial<Record<AuthMethod, RemoveHandler>> = {};

  const methods: AuthMethods = {
    /**
     * Returns the active authentication methods for the given account.
     * Queries whichever stores are configured.
     */
    getAccountAuthMethods: async (
      accountId: AccountId,
    ): Promise<AuthMethod[]> => {
      const result: AuthMethod[] = [];

      if (config.password) {
        const has =
          await config.password.passwordStore.existsForAccount(accountId);
        if (has) result.push("password");
      }

      if (config.oauth) {
        const has = await config.oauth.oauthStore.existsForAccount(accountId);
        if (has) result.push("oauth");
      }

      return result;
    },

    /**
     * Removes the specified authentication method.
     *
     * @throws {UnsupportedAuthMethodError} When no handler is registered for `method`.
     * @throws {CannotRemoveLastCredentialError} When removal would lock the account.
     * @throws {OAuthProviderNotFoundError} When the specified OAuth provider is not linked.
     */
    removeAuthMethod: async (
      accountId: AccountId,
      method: AuthMethod,
      options?: { provider?: string },
    ): Promise<void> => {
      const handler = removeHandlers[method];
      if (!handler) {
        throw new UnsupportedAuthMethodError(method);
      }
      await handler(accountId, options);
    },
  };

  const plugins: AuthPlugin[] = [passwordPlugin, oauthPlugin];
  for (const plugin of plugins) {
    plugin(methods, config, removeHandlers);
  }

  return methods;
}

// ── Password plugin ──────────────────────────────────────────────────────────

/**
 * Activates all password-based flows when `config.password` is present.
 * @internal
 */
const passwordPlugin: AuthPlugin = (methods, config, removeHandlers) => {
  if (!config.password) return;

  const { passwordStore, hashManager } = config.password;

  const registerUseCase = new RegisterWithPasswordUseCase({
    accountRepo: config.accountRepo,
    passwordStore,
    generateId: config.generateId,
    hashPassword: hashManager.hash.bind(hashManager),
    issueReceipt: config.tokenSigner,
  });

  const authenticateUseCase = new AuthenticateWithPasswordUseCase({
    passwordStore,
    passwordManager: hashManager,
    issueReceipt: config.tokenSigner,
    logger: config.logger,
  });

  methods.registerWithPassword = (input): Promise<Receipt> =>
    registerUseCase.execute(input);

  methods.authenticateWithPassword = (input): Promise<Receipt> =>
    authenticateUseCase.execute(input);

  methods.addPasswordToAccount = async (
    accountId: AccountId,
    password: string,
  ): Promise<void> => {
    const useCase = new AddPasswordAuthUseCase({
      accountRepo: config.accountRepo,
      passwordStore,
      hashManager,
      generateId: config.generateId,
      authMethods: methods.getAccountAuthMethods,
    });
    await useCase.execute({ accountId, password });
  };

  removeHandlers["password"] = async (accountId): Promise<void> => {
    const hasOAuth = config.oauth
      ? await config.oauth.oauthStore.existsForAccount(accountId)
      : false;

    if (!hasOAuth) {
      throw new CannotRemoveLastCredentialError();
    }

    await passwordStore.deleteByAccountId(accountId);
  };
};

// ── OAuth plugin ─────────────────────────────────────────────────────────────

/**
 * Activates all OAuth-based flows when `config.oauth` is present.
 * @internal
 */
const oauthPlugin: AuthPlugin = (methods, config, removeHandlers) => {
  if (!config.oauth) return;

  const { oauthStore } = config.oauth;

  const authenticateOAuthUseCase = new AuthenticateOAuthUseCase({
    accountRepository: config.accountRepo,
    oauthCredentialStore: oauthStore,
    issueReceipt: config.tokenSigner,
    generateId: config.generateId,
    logger: config.logger,
  });

  const linkOAuthUseCase = new LinkOAuthToAccountUseCase({
    accountRepository: config.accountRepo,
    oauthCredentialStore: oauthStore,
    verifyReceipt: config.verifyReceipt,
    generateId: config.generateId,
    logger: config.logger,
  });

  methods.authenticateWithOAuth = (input): Promise<Receipt> =>
    authenticateOAuthUseCase.execute(input);

  methods.linkOAuthToAccount = (input): Promise<void> =>
    linkOAuthUseCase.execute(input);

  removeHandlers["oauth"] = async (
    accountId: AccountId,
    options?: { provider?: string },
  ): Promise<void> => {
    const credentials = await oauthStore.findAllByAccountId(accountId);

    if (options?.provider) {
      const provider = options.provider;
      const exists = credentials.some((c) => c.oauthProvider === provider);

      if (!exists) {
        throw new OAuthProviderNotFoundError(provider);
      }

      // Guard: removing the last OAuth credential when there is no password
      if (credentials.length <= 1) {
        const hasPassword = config.password
          ? await config.password.passwordStore.existsForAccount(accountId)
          : false;
        if (!hasPassword) {
          throw new CannotRemoveLastCredentialError();
        }
      }

      await oauthStore.deleteByProvider(accountId, provider);
      return;
    }

    // Remove all OAuth credentials — ensure a password exists
    const hasPassword = config.password
      ? await config.password.passwordStore.existsForAccount(accountId)
      : false;

    if (!hasPassword) {
      throw new CannotRemoveLastCredentialError();
    }

    await oauthStore.deleteAllForAccount(accountId);
  };
};
