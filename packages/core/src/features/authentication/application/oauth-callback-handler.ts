import { Receipt } from "../../receipts/domain/receipt.entity.js";
import { IssueReceiptUseCase } from "../../receipts/application/issue-receipt.usecase.js";
import { AuthenticateOAuthUseCase } from "./authenticate-oauth.usecase.js";

export interface OAuthProfile {
  /** The email address returned by the OAuth provider. */
  email: string;
  /** The provider string (e.g. `"google"`, `"github"`). */
  provider: string;
  /** The stable user identifier from the provider (e.g. Google `sub`). */
  providerId: string;
}

/**
 * Composes `AuthenticateOAuthUseCase` + `IssueReceiptUseCase` into one call.
 * Framework-agnostic — no NestJS or Express dependencies.
 */
export class OAuthCallbackHandler {
  private readonly authenticateOAuth: AuthenticateOAuthUseCase;
  private readonly issueReceipt: IssueReceiptUseCase;

  constructor(
    authenticateOAuth: AuthenticateOAuthUseCase,
    issueReceipt: IssueReceiptUseCase,
  ) {
    this.authenticateOAuth = authenticateOAuth;
    this.issueReceipt = issueReceipt;
  }

  public async handle(profile: OAuthProfile): Promise<Receipt> {
    const accountId = await this.authenticateOAuth.execute({
      rawEmail: profile.email,
      provider: profile.provider,
      providerId: profile.providerId,
    });
    return await this.issueReceipt.execute(accountId);
  }
}
