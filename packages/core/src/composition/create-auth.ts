import { InvalidConfigurationError } from "../kernel/shared/index.js";
import { AuthOrchestrator } from "../kernel/auth/auth-orchestrator.js";
import { RemoveAuthMethodUseCase } from "../kernel/auth/usecases/remove-auth-method.usecase.js";
import { buildCoreContext } from "./context-builder.js";
import type { AuthConfig, AuthMethods, CoreAuthMethods } from "./types.js";
import { PasswordModule } from "../modules/password/index.js";
import { OAuthModule } from "../modules/oauth/index.js";

const MODULES = [PasswordModule, OAuthModule] as const;

/**
 * Builds the authentication API from your config.
 *
 * @throws {InvalidConfigurationError} When two modules declare the same method name.
 * @public
 */
export function createAuth<T extends AuthConfig>(config: T): AuthMethods<T> {
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
    removeAuthMethod: (accountId, method, options) =>
      removeUC.execute({
        accountId,
        method,
        ...(options?.provider !== undefined
          ? { provider: options.provider }
          : {}),
      }),
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
