import type { AccountId } from "../shared/index.js";
import type { AuthMethod, AuthMethodPort } from "./auth-method.port.js";

/**
 * Strategy runner — blind to all module internals.
 *
 * Queries registered {@link AuthMethodPort}s to answer identity questions
 * about an account without knowing anything about module storage.
 * @public
 */
export class AuthOrchestrator {
  private readonly ports: AuthMethodPort[];

  constructor(ports: AuthMethodPort[]) {
    this.ports = ports;
  }

  async getActiveMethods(accountId: AccountId): Promise<AuthMethod[]> {
    const results = await Promise.all(
      this.ports.map(async (p) => ({
        method: p.method,
        exists: await p.exists(accountId),
      })),
    );
    return results.filter((r) => r.exists).map((r) => r.method);
  }

  async countForMethod(
    accountId: AccountId,
    method: AuthMethod,
  ): Promise<number> {
    const port = this.ports.find((p) => p.method === method);
    if (!port) return 0;
    return await port.count(accountId);
  }
}
