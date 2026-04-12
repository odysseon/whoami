import type { AuthConfig, AuthMethods, CoreAuthMethods } from "./types.js";
import type { AccountId } from "./shared/index.js";
import type { AuthMethod } from "./shared/domain/auth-method.js";

import { buildCoreContext } from "./modules/core-context.js";
import { PasswordModule } from "./modules/password/index.js";
import { OAuthModule } from "./modules/oauth/index.js";

import { RemoveAuthMethodUseCase } from "./features/authentication/application/remove-auth-method.usecase.js";

// ── Module registry ───────────────────────────────────────────────────────────
//
// To add a new auth type: implement AuthModule in src/modules/<key>/index.ts,
// add its entry to AuthMethodRegistry in types.ts, then append it here.
// createAuth never needs to change for individual auth types.

const MODULES = [PasswordModule, OAuthModule] as const;

/**
 * Composes the full authentication facade from declarative config.
 *
 * Iterates over the registered {@link MODULES}. For each module whose config
 * key is present in `config`, it calls `module.create(config[key], ctx)` and
 * merges the returned methods into the final object.
 *
 * @public
 */
export function createAuth<T extends AuthConfig>(config: T): AuthMethods<T> {
  // ── Build shared core context ────────────────────────────────────────────
  const ctx = buildCoreContext({
    accountRepo: config.accountRepo,
    receiptSigner: config.receiptSigner,
    receiptVerifier: config.receiptVerifier,
    logger: config.logger,
    generateId: config.generateId,
    ...(config.tokenLifespanMinutes
      ? { tokenLifespanMinutes: config.tokenLifespanMinutes }
      : {}),
  });

  // ── Build core methods ───────────────────────────────────────────────────
  const getAccountAuthMethods = async (
    accountId: AccountId,
  ): Promise<AuthMethod[]> => {
    const methods: AuthMethod[] = [];

    if (
      config.password &&
      (await config.password.passwordStore.existsForAccount(accountId))
    ) {
      methods.push("password");
    }

    if (
      config.oauth &&
      (await config.oauth.oauthStore.existsForAccount(accountId))
    ) {
      methods.push("oauth");
    }

    return methods;
  };

  const removeUC = new RemoveAuthMethodUseCase({
    ...(config.password
      ? { passwordStore: config.password.passwordStore }
      : {}),
    ...(config.oauth ? { oauthStore: config.oauth.oauthStore } : {}),
  } as ConstructorParameters<typeof RemoveAuthMethodUseCase>[0]);

  const coreMethods: CoreAuthMethods = {
    getAccountAuthMethods,
    removeAuthMethod: (
      accountId: AccountId,
      method: AuthMethod,
      options?: { provider?: string },
    ) =>
      removeUC.execute({
        accountId,
        method,
        ...(options?.provider ? { provider: options.provider } : {}),
      }),
  };

  // ── Iterate modules, accumulate methods ──────────────────────────────────
  const moduleMethods = MODULES.reduce(
    (acc, mod) => {
      const modConfig = config[mod.key as keyof typeof config];
      if (!modConfig) return acc;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { ...acc, ...mod.create(modConfig as any, ctx) };
    },
    {} as Record<string, unknown>,
  );

  // ── Final composition (no mutation) ─────────────────────────────────────
  return {
    ...coreMethods,
    ...moduleMethods,
  } as AuthMethods<T>;
}
