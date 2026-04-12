import type { AccountId } from "../../shared/index.js";
import {
  CannotRemoveLastCredentialError,
  UnsupportedAuthMethodError,
} from "../../shared/index.js";
import type { AuthMethod, AuthMethodPort } from "../auth-method.port.js";
import { AuthOrchestrator } from "../auth-orchestrator.js";

/**
 * Per-method deletion contract exposed by each module to the kernel.
 * @public
 */
export interface AuthMethodRemover {
  readonly method: AuthMethod;
  remove(accountId: AccountId, provider?: string): Promise<void>;
}

export interface RemoveAuthMethodInput {
  accountId: AccountId;
  method: AuthMethod;
  provider?: string;
}

/**
 * Removes an auth method while enforcing the last-credential invariant.
 * Delegates actual deletion to registered {@link AuthMethodRemover}s.
 * @public
 */
export class RemoveAuthMethodUseCase {
  private readonly orchestrator: AuthOrchestrator;
  private readonly removers: Map<AuthMethod, AuthMethodRemover>;

  constructor(ports: AuthMethodPort[], removers: AuthMethodRemover[]) {
    this.orchestrator = new AuthOrchestrator(ports);
    this.removers = new Map(removers.map((r) => [r.method, r]));
  }

  async execute(input: RemoveAuthMethodInput): Promise<void> {
    const remover = this.removers.get(input.method);
    if (!remover) throw new UnsupportedAuthMethodError(input.method);

    const activeMethods = await this.orchestrator.getActiveMethods(
      input.accountId,
    );
    const otherMethods = activeMethods.filter((m) => m !== input.method);

    // Block removal if it would be the last method, except when targeting
    // a specific oauth provider (the module's remover handles that granularity)
    if (otherMethods.length === 0) {
      if (input.method !== "oauth" || !input.provider) {
        throw new CannotRemoveLastCredentialError();
      }
    }

    await remover.remove(input.accountId, input.provider);
  }
}
