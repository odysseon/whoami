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

  /**
   * Returns the number of credentials that would remain for `method` after the
   * described removal, delegating to the port's `countAfterRemoval` when it is
   * implemented.
   *
   * Falls back to `Math.max(0, count - 1)` for provider-scoped removals and
   * `0` for full-method removals when the port does not implement the optional
   * method.
   *
   * @throws {OAuthProviderNotFoundError} (or equivalent) when the port
   * implements `countAfterRemoval` and the provider is not linked.
   */
  async countRemainingAfterRemoval(
    accountId: AccountId,
    method: AuthMethod,
    provider?: string,
  ): Promise<number> {
    const port = this.ports.find((p) => p.method === method);
    if (!port) return 0;

    if (port.countAfterRemoval !== undefined) {
      return await port.countAfterRemoval(accountId, provider);
    }

    // Generic fallback for ports that do not implement countAfterRemoval.
    const total = await port.count(accountId);
    if (provider !== undefined) {
      return Math.max(0, total - 1);
    }
    return 0;
  }
}
