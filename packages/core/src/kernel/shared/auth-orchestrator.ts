import type { AuthModule } from "../ports/auth-module.port.js";
import {
  UnsupportedAuthMethodError,
  CannotRemoveLastCredentialError,
} from "../domain/errors/index.js";

/**
 * Orchestrates multiple authentication modules.
 * Handles cross-module operations like counting total credentials
 * and enforcing the last-credential invariant.
 */
export class AuthOrchestrator {
  readonly #modules: Map<string, AuthModule>;

  constructor(modules: AuthModule[]) {
    this.#modules = new Map();
    for (const module of modules) {
      this.#modules.set(module.kind, module);
    }
  }

  /**
   * Gets a module by kind
   * @param kind - The module kind
   * @returns The module
   * @throws UnsupportedAuthMethodError if the module is not found
   */
  getModule(kind: string): AuthModule {
    const module = this.#modules.get(kind);
    if (!module) {
      throw new UnsupportedAuthMethodError(kind);
    }
    return module;
  }

  /**
   * Checks if a module is registered
   * @param kind - The module kind
   * @returns True if the module is registered
   */
  hasModule(kind: string): boolean {
    return this.#modules.has(kind);
  }

  /**
   * Gets all registered module kinds
   * @returns Array of registered module kinds
   */
  getRegisteredKinds(): string[] {
    return Array.from(this.#modules.keys());
  }

  /**
   * Counts the total number of credentials for an account across all modules
   * @param accountId - The account ID
   * @returns The total number of credentials
   */
  async countTotalCredentials(accountId: string): Promise<number> {
    let total = 0;
    for (const module of this.#modules.values()) {
      total += await module.countCredentialsForAccount(accountId);
    }
    return total;
  }

  /**
   * Removes an auth method from an account, enforcing the last-credential invariant
   * @param accountId - The account ID
   * @param method - The auth method to remove
   * @param options - Optional parameters (e.g., specific provider for OAuth)
   * @throws CannotRemoveLastCredentialError if this would remove the last credential
   */
  async removeAuthMethod(
    accountId: string,
    method: string,
    options?: { provider?: string },
  ): Promise<void> {
    const module = this.getModule(method);

    // Count credentials that would remain after removal
    const currentCount = await module.countCredentialsForAccount(accountId);
    const otherModulesCount = await this.countOtherModulesCredentials(
      accountId,
      method,
    );

    // For OAuth with specific provider, we need to check if there are other credentials
    // from the same provider or other providers
    let remainingAfterRemoval: number;

    if (method === "oauth" && options?.provider) {
      // When removing a specific OAuth provider, we can't easily count
      // remaining credentials from that provider, so we assume at least 1
      // would be removed. This is a conservative approach.
      remainingAfterRemoval = otherModulesCount + Math.max(0, currentCount - 1);
    } else {
      // Removing all credentials of this type
      remainingAfterRemoval = otherModulesCount;
    }

    if (remainingAfterRemoval === 0) {
      throw new CannotRemoveLastCredentialError();
    }

    // Perform the removal
    if (method === "oauth" && options?.provider) {
      // For OAuth, we need to handle provider-specific removal
      // This is delegated to the OAuth module's methods
      const oauthModule = module as AuthModule & {
        methods: {
          unlinkProvider: (
            accountId: string,
            provider: string,
          ) => Promise<void>;
        };
      };
      await oauthModule.methods.unlinkProvider(accountId, options.provider);
    } else {
      await module.removeAllCredentialsForAccount(accountId);
    }
  }

  /**
   * Counts credentials from all modules except the specified one
   * @param accountId - The account ID
   * @param excludeKind - The module kind to exclude
   * @returns The count of credentials from other modules
   */
  private async countOtherModulesCredentials(
    accountId: string,
    excludeKind: string,
  ): Promise<number> {
    let total = 0;
    for (const [kind, module] of this.#modules) {
      if (kind !== excludeKind) {
        total += await module.countCredentialsForAccount(accountId);
      }
    }
    return total;
  }

  /**
   * Gets all auth methods for an account
   * @param accountId - The account ID
   * @returns Array of objects with method kind and count
   */
  async getAccountAuthMethods(
    accountId: string,
  ): Promise<Array<{ kind: string; count: number }>> {
    const methods: Array<{ kind: string; count: number }> = [];
    for (const [kind, module] of this.#modules) {
      const count = await module.countCredentialsForAccount(accountId);
      if (count > 0) {
        methods.push({ kind, count });
      }
    }
    return methods;
  }
}
