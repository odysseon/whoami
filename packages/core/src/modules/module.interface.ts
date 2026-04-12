import type {
  AuthMethod,
  AuthMethodPort,
} from "../kernel/auth/auth-method.port.js";
import type { AuthMethodRemover } from "../kernel/auth/usecases/remove-auth-method.usecase.js";
import type { CoreContext } from "../composition/context-builder.js";

/**
 * Contract every pluggable auth module must satisfy.
 *
 * A module is a self-contained vertical slice that:
 * - declares which {@link AuthMethod} key it handles
 * - accepts its own feature-specific config
 * - receives shared infrastructure via {@link CoreContext}
 * - returns a strongly-typed methods object
 * - exposes an {@link AuthMethodPort} so the kernel can check credential existence
 * - exposes an {@link AuthMethodRemover} so the kernel can delegate deletion
 *
 * ## Adding a new auth method
 * 1. Create `modules/<type>/index.ts` implementing this interface.
 * 2. Add one entry to `AuthMethodRegistry` in `composition/types.ts`.
 * 3. Append to `MODULES` in `composition/create-auth.ts`.
 * Nothing else changes.
 *
 * @public
 */
export interface AuthModule<TConfig, TMethods> {
  readonly key: AuthMethod;
  create(config: TConfig, ctx: CoreContext): TMethods;
  buildAuthMethodPort(config: TConfig): AuthMethodPort;
  buildAuthMethodRemover(config: TConfig): AuthMethodRemover;
}
