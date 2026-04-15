import {
  InvalidConfigurationError,
  InvalidCredentialError,
} from "../kernel/shared/index.js";
import { AuthOrchestrator } from "../kernel/auth/auth-orchestrator.js";
import { RemoveAuthMethodUseCase } from "../kernel/auth/usecases/remove-auth-method.usecase.js";
import { buildCoreContext } from "./context-builder.js";
import type { AuthConfig, AuthMethods, CoreAuthMethods } from "./types.js";
import { PasswordModule } from "../modules/password/index.js";
import { OAuthModule } from "../modules/oauth/index.js";

const MODULES = [PasswordModule, OAuthModule] as const;

/**
 * Emits a one-time deprecation warning when module config is supplied via the
 * flat top-level keys (`password`, `oauth`).
 * In v12 these keys will be replaced by `modules: [PasswordModule(...), ...]`.
 * @internal
 */
let _deprecationWarned = false;
function warnFlatConfigDeprecation(keys: string[]): void {
  if (_deprecationWarned) return;
  _deprecationWarned = true;
  process.emitWarning(
    `[whoami] DEPRECATION (v11.1.0): Configuring auth modules via top-level ` +
      `keys (${keys.map((k) => `"${k}"`).join(", ")}) is deprecated and will ` +
      `be removed in v12.0.0. ` +
      `Migrate to: import { PasswordModule } from '@odysseon/whoami-core/password'; ` +
      `createAuth({ ..., modules: [PasswordModule(config), OAuthModule(config)] }); ` +
      `See: https://github.com/odysseon/whoami/blob/main/docs/migration-v11-to-v12.md`,
    "DeprecationWarning",
  );
}

/**
 * Builds the authentication API from your config.
 *
 * @throws {InvalidConfigurationError} When two modules declare the same method name.
 * @deprecated Passing module config via top-level keys (`password`, `oauth`) is
 * deprecated. Use `modules: [PasswordModule(config), ...]` in v12.
 * @public
 */
export function createAuth<T extends AuthConfig>(config: T): AuthMethods<T> {
  // Warn when the flat module-key config shape is used (will be removed in v12).
  const flatModuleKeys = MODULES.map((m) => m.key).filter(
    (k) => config[k as keyof typeof config] !== undefined,
  );
  if (flatModuleKeys.length > 0) {
    warnFlatConfigDeprecation(flatModuleKeys);
  }
  const ctx = buildCoreContext({
    accountRepo: config.accountRepo,
    receiptSigner: config.receiptSigner,
    receiptVerifier: config.receiptVerifier,
    logger: config.logger,
    idGenerator: config.idGenerator,
    ...(config.clock !== undefined ? { clock: config.clock } : {}),
    ...(config.tokenLifespanMinutes !== undefined
      ? { tokenLifespanMinutes: config.tokenLifespanMinutes }
      : {}),
  });

  const authMethodPorts = MODULES.flatMap((mod) => {
    const modConfig = config[mod.key as keyof typeof config];
    if (!modConfig) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return [mod.buildAuthMethodPort(modConfig as any)];
  });

  const authMethodRemovers = MODULES.flatMap((mod) => {
    const modConfig = config[mod.key as keyof typeof config];
    if (!modConfig) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return [mod.buildAuthMethodRemover(modConfig as any)];
  });

  const orchestrator = new AuthOrchestrator(authMethodPorts);
  const removeUC = new RemoveAuthMethodUseCase(
    authMethodPorts,
    authMethodRemovers,
  );

  const coreMethods: CoreAuthMethods = {
    getAccountAuthMethods: (accountId) =>
      orchestrator.getActiveMethods(accountId),
    removeAuthMethod: (accountId, method, options) => {
      if (options?.provider !== undefined && options.provider.trim() === "") {
        throw new InvalidCredentialError(
          "options.provider must not be an empty string — pass undefined to remove all credentials for the method.",
        );
      }
      return removeUC.execute({
        accountId,
        method,
        ...(options?.provider !== undefined
          ? { provider: options.provider }
          : {}),
      });
    },
  };

  const CORE_KEYS = new Set<string>(Object.keys(coreMethods));

  const moduleMethods = MODULES.reduce(
    (acc, mod) => {
      const modConfig = config[mod.key as keyof typeof config];
      if (!modConfig) return acc;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newMethods = mod.create(modConfig as any, ctx);

      const collisions = Object.keys(newMethods).filter(
        (k) => CORE_KEYS.has(k) || k in acc,
      );
      if (collisions.length > 0) {
        throw new InvalidConfigurationError(
          `[whoami] Module "${mod.key}" declares method(s) that collide with already-registered names: ` +
            `${collisions.map((k) => `"${k}"`).join(", ")}.`,
        );
      }

      return { ...acc, ...newMethods };
    },
    {} as Record<string, unknown>,
  );

  return { ...moduleMethods, ...coreMethods } as AuthMethods<T>;
}
