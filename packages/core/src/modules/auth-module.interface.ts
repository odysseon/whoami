import type { AuthMethod } from "../shared/domain/auth-method.js";
import type { CoreContext } from "./core-context.js";

/**
 * Contract that every pluggable authentication module must satisfy.
 *
 * A module is a self-contained unit that:
 * - declares which {@link AuthMethod} key it handles (`key`)
 * - accepts its own feature-specific config (`TConfig`)
 * - receives shared infrastructure via {@link CoreContext}
 * - returns a strongly-typed methods object (`TMethods`)
 *
 * To add a new authentication type:
 * 1. Create `src/modules/<type>/index.ts` implementing this interface.
 * 2. Add one entry to `AuthMethodRegistry` in `types.ts`.
 * 3. Register the module in the `MODULES` array in `whoami.ts`.
 * Nothing else changes.
 *
 * @public
 */
export interface AuthModule<TConfig, TMethods> {
  /**
   * The auth method key this module handles.
   * Must match the corresponding key in `AuthMethodRegistry`.
   */
  readonly key: AuthMethod;

  /**
   * Instantiates use-cases and returns the public method surface for this
   * authentication type.
   *
   * Called once per `createAuth` invocation, only when `config[key]` is present.
   *
   * @param config  - The feature-specific configuration for this module.
   * @param ctx     - Shared infrastructure from the outer `createAuth` call.
   * @returns The methods object for this auth type.
   */
  create(config: TConfig, ctx: CoreContext): TMethods;
}
