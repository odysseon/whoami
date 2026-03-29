import { Injectable } from "@nestjs/common";
import {
  AuthenticateOAuthUseCase,
  IssueReceiptUseCase,
  Receipt,
} from "@odysseon/whoami-core";

/**
 * The normalised profile shape that any OAuth provider strategy must supply.
 * Map your provider-specific profile object (Passport, raw fetch, etc.) to
 * this shape before passing it to the handler.
 */
export interface OAuthProfile {
  /**
   * The authenticated user's email address as returned by the provider.
   */
  email: string;

  /**
   * The provider identifier string (e.g. `"google"`, `"github"`).
   */
  provider: string;

  /**
   * The stable user identifier issued by the provider
   * (e.g. Google `sub`, GitHub numeric `id` as a string).
   */
  providerId: string;
}

/**
 * Composes the full OAuth authentication flow into a single injectable service.
 *
 * Internally it runs `AuthenticateOAuthUseCase` (auto-register or verify) and
 * `IssueReceiptUseCase` in sequence. The consumer controller calls `handle(profile)`
 * and receives a signed `Receipt` ready to be returned to the client.
 *
 * After this call, you are responsible for creating or hydrating your own user record
 * using `receipt.accountId.value` as the foreign key.
 *
 * @example
 * ```ts
 * // In your OAuth callback controller:
 * const receipt = await this.oauthHandler.handle({
 *   email: profile.email,
 *   provider: 'google',
 *   providerId: profile.sub,
 * });
 * await this.userService.getOrCreate(receipt.accountId.value, profile);
 * return { token: receipt.token, expiresAt: receipt.expiresAt };
 * ```
 */
@Injectable()
export class OAuthCallbackHandler {
  constructor(
    private readonly authenticateOAuth: AuthenticateOAuthUseCase,
    private readonly issueReceipt: IssueReceiptUseCase,
  ) {}

  /**
   * Authenticates or auto-registers an account via OAuth, then issues a signed receipt.
   *
   * @param profile - The normalised OAuth profile from the provider strategy.
   * @returns The signed receipt containing the token and account identity.
   * @throws {AuthenticationError} When an existing credential fails OAuth verification.
   */
  public async handle(profile: OAuthProfile): Promise<Receipt> {
    const accountId = await this.authenticateOAuth.execute({
      rawEmail: profile.email,
      provider: profile.provider,
      providerId: profile.providerId,
    });

    return await this.issueReceipt.execute(accountId);
  }
}
