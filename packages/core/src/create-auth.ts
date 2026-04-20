import type { AuthModule } from "./kernel/ports/auth-module.port.js";
import { AuthOrchestrator } from "./kernel/shared/auth-orchestrator.js";

/**
 * Configuration for createAuth
 */
export interface AuthConfig {
  readonly modules: AuthModule[];
}

/**
 * Core methods always available
 */
export interface CoreAuthMethods {
  /**
   * Gets all authentication methods for an account
   * @param accountId - The account ID
   * @returns Array of method kinds and counts
   */
  getAccountAuthMethods(
    accountId: string,
  ): Promise<Array<{ kind: string; count: number }>>;

  /**
   * Removes an authentication method from an account
   * @param accountId - The account ID
   * @param method - The method to remove
   * @param options - Optional parameters
   */
  removeAuthMethod(
    accountId: string,
    method: string,
    options?: { provider?: string },
  ): Promise<void>;
}

/**
 * Auth methods returned by createAuth.
 * Methods from configured modules are merged with core methods.
 */
export type AuthMethods = CoreAuthMethods & Record<string, unknown>;

/**
 * Creates the authentication facade from configured modules.
 *
 * This is the main entry point for the whoami library.
 * Configure only the modules you need:
 *
 * @example
 * ```typescript
 * const auth = createAuth({
 *   modules: [
 *     PasswordModule({ ... }),
 *     OAuthModule({ ... }),
 *     MagicLinkModule({ ... }),
 *   ],
 * });
 *
 * // Now you can use methods from all configured modules
 * await auth.registerWithPassword({ email, password });
 * await auth.authenticateWithOAuth({ provider, providerId, email });
 * await auth.requestMagicLink({ email });
 * ```
 *
 * @param config - The auth configuration with modules
 * @returns The auth methods facade
 */
export function createAuth(config: AuthConfig): AuthMethods {
  const orchestrator = new AuthOrchestrator(config.modules);

  // Collect all methods from all modules
  const moduleMethods: Record<string, unknown> = {};
  for (const module of config.modules) {
    Object.assign(moduleMethods, module.methods);
  }

  // Create core methods
  const coreMethods: CoreAuthMethods = {
    async getAccountAuthMethods(accountId: string) {
      return await orchestrator.getAccountAuthMethods(accountId);
    },

    async removeAuthMethod(
      accountId: string,
      method: string,
      options?: { provider?: string },
    ) {
      return await orchestrator.removeAuthMethod(accountId, method, options);
    },
  };

  // Merge core methods with module methods
  return {
    ...coreMethods,
    ...moduleMethods,
  };
}
