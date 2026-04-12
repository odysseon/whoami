import type { AccountId } from "../../shared/index.js";
import {
  CannotRemoveLastCredentialError,
  UnsupportedAuthMethodError,
} from "../../shared/index.js";
import type { AuthMethod, AuthMethodPort } from "../auth-method.port.js";
import { AuthOrchestrator } from "../auth-orchestrator.js";

/**
 * Per-method deletion contract exposed by each module to the kernel.
 * Implementations must be dumb — just delete, no invariant checks.
 * All lockout logic lives here in the kernel.
 * @public
 */
export interface AuthMethodRemover {
  readonly method: AuthMethod;
  /**
   * Deletes the credential(s) for this method.
   * For multi-credential methods, `provider` narrows to a single credential.
   * Throws {@link OAuthProviderNotFoundError} if `provider` is given but not found.
   */
  remove(accountId: AccountId, provider?: string): Promise<void>;
}

export interface RemoveAuthMethodInput {
  accountId: AccountId;
  method: AuthMethod;
  /** For multi-credential methods: target a single credential rather than all. */
  provider?: string;
}

/**
 * Removes an authentication method while enforcing the last-credential invariant.
 *
 * Lockout check is fully generic — no module names or types are referenced.
 * The kernel asks: would this removal leave the account with zero total credentials?
 * If so, it rejects. Otherwise it delegates blindly to the remover.
 *
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

    await this.assertNotLastCredential(input);

    await remover.remove(input.accountId, input.provider);
  }

  private async assertNotLastCredential(
    input: RemoveAuthMethodInput,
  ): Promise<void> {
    const activeMethods = await this.orchestrator.getActiveMethods(
      input.accountId,
    );

    // Count how many total credentials would remain after this removal.
    // For each active method:
    //   - If it's a different method: all its credentials survive → add its count.
    //   - If it's the same method AND we're removing a single credential (provider given):
    //       remaining = count - 1
    //   - If it's the same method AND we're removing all (no provider):
    //       remaining = 0

    let remainingTotal = 0;

    for (const method of activeMethods) {
      const credCount = await this.orchestrator.countForMethod(
        input.accountId,
        method,
      );

      if (method !== input.method) {
        remainingTotal += credCount;
      } else if (input.provider !== undefined) {
        // Removing one credential from this method
        remainingTotal += Math.max(0, credCount - 1);
      }
      // else: removing all credentials of this method → contributes 0
    }

    if (remainingTotal === 0) {
      throw new CannotRemoveLastCredentialError();
    }
  }
}
