import type { AccountId } from "../shared/index.js";
import type { AuthMethod, AuthMethodPort } from "./auth-method.port.js";

/**
 * Strategy runner — blind to all module internals.
 *
 * The kernel uses this to answer "which auth methods does this account have?"
 * without importing any module-specific store or type.
 * @public
 */
export class AuthOrchestrator {
  private readonly ports: AuthMethodPort[];

  constructor(ports: AuthMethodPort[]) {
    this.ports = ports;
  }

  /**
   * Returns the active authentication methods for an account by querying
   * each registered {@link AuthMethodPort}.
   */
  async getActiveMethods(accountId: AccountId): Promise<AuthMethod[]> {
    const results = await Promise.all(
      this.ports.map(async (p) => ({
        method: p.method,
        exists: await p.exists(accountId),
      })),
    );
    return results.filter((r) => r.exists).map((r) => r.method);
  }
}
