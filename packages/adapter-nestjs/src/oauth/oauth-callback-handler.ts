import { Inject, Injectable } from "@nestjs/common";
import {
  type AuthMethods,
  type Receipt,
  InvalidConfigurationError,
} from "@odysseon/whoami-core";
import { AUTH_METHODS } from "../tokens.js";

/**
 * The normalised profile shape that any OAuth provider strategy must supply.
 * Map your provider-specific profile object (Passport, raw fetch, etc.) to
 * this shape before passing it to the handler.
 */
export interface OAuthProfile {
  /** The authenticated user's email address as returned by the provider. */
  email: string;
  /** The provider identifier string (e.g. `"google"`, `"github"`). */
  provider: string;
  /** The stable user identifier issued by the provider. */
  providerId: string;
}

/**
 * Composes the full OAuth authentication flow into a single injectable service.
 *
 * Delegates to the {@link AuthMethods} facade (`auth.authenticateWithOAuth`),
 * which requires `oauth` to be configured in {@link WhoamiModuleOptions}.
 * The consumer controller calls `handle(profile)` and receives a signed
 * `Receipt` ready to be returned to the client.
 *
 * @example
 * ```ts
 * const receipt = await this.oauthHandler.handle({
 *   email: profile.email,
 *   provider: 'google',
 *   providerId: profile.sub,
 * });
 * return { token: receipt.token, expiresAt: receipt.expiresAt };
 * ```
 */
@Injectable()
export class OAuthCallbackHandler {
  constructor(
    @Inject(AUTH_METHODS)
    private readonly auth: AuthMethods,
  ) {}

  /**
   * Authenticates or auto-registers an account via OAuth, then issues a signed receipt.
   *
   * @param profile - The normalised OAuth profile from the provider strategy.
   * @returns The signed receipt containing the token and account identity.
   * @throws {Error} When `oauth` is not configured in WhoamiModuleOptions.
   * @throws {AuthenticationError} When an existing credential fails OAuth verification.
   */
  public async handle(profile: OAuthProfile): Promise<Receipt> {
    if (!this.auth.authenticateWithOAuth) {
      throw new InvalidConfigurationError(
        "OAuth is not configured. Add `oauth: { oauthStore }` to WhoamiModuleOptions.",
      );
    }
    return await this.auth.authenticateWithOAuth({
      email: profile.email,
      provider: profile.provider,
      providerId: profile.providerId,
    });
  }
}
