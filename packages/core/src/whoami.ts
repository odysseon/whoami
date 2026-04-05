import {
  AddPasswordAuthUseCase,
  AuthenticateOAuthUseCase,
  AuthenticateWithPasswordUseCase,
} from "./features/authentication/index.js";
import { LinkOAuthToAccountUseCase } from "./features/credentials/application/link-oauth.usecase.js";
import { RegisterWithPasswordUseCase } from "./features/credentials/application/register-password.usecase.js";
import { Receipt } from "./features/receipts/index.js";
import { AccountId } from "./shared/index.js";
import { AuthConfig, AuthMethod, AuthMethods } from "./types.js";

// --- Plugin Types ---
type AuthPlugin = (
  methods: AuthMethods,
  config: AuthConfig,
  removeHandlers: Partial<Record<AuthMethod, RemoveHandler>>,
) => void;

type RemoveHandler = (
  accountId: AccountId,
  options?: { provider?: string },
) => Promise<void>;

// --- Core Factory ---
export function createAuth(config: AuthConfig): AuthMethods {
  const removeHandlers: Partial<Record<AuthMethod, RemoveHandler>> = {};

  const methods: AuthMethods = {
    getAccountAuthMethods: async (accountId: AccountId) => {
      const result: AuthMethod[] = [];

      if (config.password) {
        const hasPassword =
          await config.password.passwordStore.existsForAccount(accountId);
        if (hasPassword) result.push("password");
      }

      if (config.oauth) {
        const hasOAuth =
          await config.oauth.oauthStore.existsForAccount(accountId);
        if (hasOAuth) result.push("oauth");
      }

      return result;
    },

    removeAuthMethod: async (accountId, method, options) => {
      const handler = removeHandlers[method];

      if (!handler) {
        throw new Error(`No handler for auth method: ${method}`);
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

// --- Password Plugin ---
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

  methods.registerWithPassword = async (input): Promise<Receipt> => {
    return await registerUseCase.execute(input);
  };

  methods.authenticateWithPassword = async (input): Promise<Receipt> => {
    return await authenticateUseCase.execute(input);
  };

  methods.addPasswordToAccount = async (
    accountId: AccountId,
    password: string,
  ): Promise<void> => {
    const useCase = new AddPasswordAuthUseCase({
      accountRepo: config.accountRepo,
      passwordStore,
      hashManager,
      authMethods: methods.getAccountAuthMethods,
    });

    await useCase.execute({ accountId, password });
  };

  removeHandlers["password"] = async (accountId): Promise<void> => {
    const hasOAuth = config.oauth
      ? await config.oauth.oauthStore.existsForAccount(accountId)
      : false;

    if (!hasOAuth) {
      throw new Error("Cannot remove last credential");
    }

    await passwordStore.deleteByAccountId(accountId);
  };
};

// --- OAuth Plugin ---
const oauthPlugin: AuthPlugin = (methods, config, removeHandlers) => {
  if (!config.oauth) return;

  const oauth = config.oauth;

  const authenticateOAuthUseCase = new AuthenticateOAuthUseCase({
    accountRepository: config.accountRepo,
    oauthCredentialStore: oauth.oauthStore,
    issueReceipt: config.tokenSigner,
    generateId: config.generateId,
    logger: config.logger,
  });

  const linkOAuthUseCase = new LinkOAuthToAccountUseCase({
    accountRepository: config.accountRepo,
    oauthCredentialStore: oauth.oauthStore,
    verifyReceipt: config.verifyReceipt,
    generateId: config.generateId,
    logger: config.logger,
  });

  methods.authenticateWithOAuth = async (input): Promise<Receipt> => {
    return await authenticateOAuthUseCase.execute(input);
  };

  methods.linkOAuthToAccount = async (input): Promise<void> => {
    await linkOAuthUseCase.execute(input);
  };

  removeHandlers["oauth"] = async (accountId, options): Promise<void> => {
    const provider = options?.provider;

    const credentials = await oauth.oauthStore.findAllByAccountId(accountId);

    // Remove specific provider
    if (provider) {
      const exists = credentials.some((c) => c.oauthProvider === provider);

      if (!exists) {
        throw new Error("OAuth provider not found");
      }

      if (credentials.length <= 1) {
        const hasPassword = config.password
          ? await config.password.passwordStore.existsForAccount(accountId)
          : false;

        if (!hasPassword) {
          throw new Error("Cannot remove last credential");
        }
      }

      await oauth.oauthStore.deleteByProvider(accountId, provider);
      return;
    }

    // Remove all OAuth credentials
    const hasPassword = config.password
      ? await config.password.passwordStore.existsForAccount(accountId)
      : false;

    if (!hasPassword) {
      throw new Error("Cannot remove last credential");
    }

    await oauth.oauthStore.deleteAllForAccount(accountId);
  };
};
