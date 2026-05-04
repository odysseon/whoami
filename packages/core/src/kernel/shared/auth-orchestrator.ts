import type { AuthModule } from "../ports/auth-module.port.js";
import {
  UnsupportedAuthMethodError,
  CannotRemoveLastCredentialError,
} from "../domain/errors/index.js";

export class AuthOrchestrator {
  readonly #modules: Map<string, AuthModule>;

  constructor(modules: AuthModule[]) {
    this.#modules = new Map();
    for (const module of modules) {
      this.#modules.set(module.kind, module);
    }
  }

  getModule(kind: string): AuthModule {
    const module = this.#modules.get(kind);
    if (!module) throw new UnsupportedAuthMethodError(kind);
    return module;
  }

  hasModule(kind: string): boolean {
    return this.#modules.has(kind);
  }

  getRegisteredKinds(): string[] {
    return Array.from(this.#modules.keys());
  }

  async countTotalCredentials(accountId: string): Promise<number> {
    let total = 0;
    for (const module of this.#modules.values()) {
      total += await module.countCredentialsForAccount(accountId);
    }
    return total;
  }

  async removeAuthMethod(
    accountId: string,
    method: string,
    options?: { provider?: string },
  ): Promise<void> {
    const module = this.getModule(method);

    const currentCount = await module.countCredentialsForAccount(accountId);
    const otherCount = await this.#countOtherModules(accountId, method);

    const remaining = options?.provider
      ? otherCount + Math.max(0, currentCount - 1)
      : otherCount;

    if (remaining === 0) throw new CannotRemoveLastCredentialError();

    await module.removeAllCredentialsForAccount(
      accountId,
      options?.provider ? options : undefined,
    );
  }

  async getAccountAuthMethods(
    accountId: string,
  ): Promise<Array<{ kind: string; count: number }>> {
    const methods: Array<{ kind: string; count: number }> = [];
    for (const [kind, module] of this.#modules) {
      const count = await module.countCredentialsForAccount(accountId);
      if (count > 0) methods.push({ kind, count });
    }
    return methods;
  }

  async #countOtherModules(
    accountId: string,
    excludeKind: string,
  ): Promise<number> {
    let total = 0;
    for (const [kind, module] of this.#modules) {
      if (kind !== excludeKind)
        total += await module.countCredentialsForAccount(accountId);
    }
    return total;
  }
}
