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
   * Provider existence is validated upstream (via {@link AuthMethodPort.countAfterRemoval})
   * before this method is called.
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
 * If so, it rejects. Otherwise it delegates to the remover.
 *
 * Error precedence:
 *   1. `UnsupportedAuthMethodError`  — no handler registered for the method.
 *   2. `OAuthProviderNotFoundError`  — provider not linked (detected via
 *      {@link AuthMethodPort.countAfterRemoval} before the lockout check).
 *   3. `CannotRemoveLastCredentialError` — removal would leave zero credentials.
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
    //
    // For each active method:
    //   - Different method: all its credentials survive → add its full count.
    //   - Same method: delegate to countRemainingAfterRemoval, which:
    //       • calls the port's countAfterRemoval (if implemented) — this lets
    //         the port validate provider existence and throw the correct domain
    //         error (e.g. OAuthProviderNotFoundError) before we reach the
    //         lockout guard.
    //       • falls back to Math.max(0, count - 1) / 0 for simple ports.

    let remainingTotal = 0;

    for (const method of activeMethods) {
      if (method !== input.method) {
        remainingTotal += await this.orchestrator.countForMethod(
          input.accountId,
          method,
        );
      } else {
        remainingTotal += await this.orchestrator.countRemainingAfterRemoval(
          input.accountId,
          method,
          input.provider,
        );
      }
    }

    if (remainingTotal === 0) {
      throw new CannotRemoveLastCredentialError();
    }
  }
}
