import type { AuthModule } from "../auth-module.interface.js";
import type { CoreContext } from "../core-context.js";
import type { OAuthConfig, OAuthAuthMethods } from "../../types.js";

import { AuthenticateOAuthUseCase } from "../../features/authentication/application/authenticate-oauth.usecase.js";
import { LinkOAuthToAccountUseCase } from "../../features/credentials/application/link-oauth.usecase.js";

import type { AuthenticateOAuthInput } from "../../features/authentication/application/authenticate-oauth.usecase.js";
import type { LinkOAuthToAccountInput } from "../../features/credentials/application/link-oauth.usecase.js";
import type { Receipt } from "../../features/receipts/index.js";

/**
 * Self-contained OAuth authentication module.
 *
 * Wires all OAuth-related use-cases from {@link OAuthConfig} +
 * {@link CoreContext} and exposes the {@link OAuthAuthMethods} surface.
 *
 * @public
 */
export const OAuthModule: AuthModule<OAuthConfig, OAuthAuthMethods> = {
  key: "oauth",

  create(config: OAuthConfig, ctx: CoreContext): OAuthAuthMethods {
    const { oauthStore } = config;
    const { accountRepo, issueReceipt, verifyReceipt, logger, generateId } =
      ctx;

    // ── Use-case instantiation ──────────────────────────────────────────────

    const authenticateUC = new AuthenticateOAuthUseCase({
      accountFinder: accountRepo,
      accountSaver: accountRepo,
      accountRemover: accountRepo,
      credentialFinder: oauthStore,
      credentialSaver: oauthStore,
      receiptIssuer: issueReceipt,
      idGenerator: generateId,
      logger,
    });

    const linkUC = new LinkOAuthToAccountUseCase({
      accountFinder: accountRepo,
      credentialFinder: oauthStore,
      credentialSaver: oauthStore,
      receiptVerifier: verifyReceipt,
      idGenerator: generateId,
      logger,
    });

    // ── Public method surface ───────────────────────────────────────────────

    return {
      authenticateWithOAuth: (
        input: AuthenticateOAuthInput,
      ): Promise<Receipt> => authenticateUC.execute(input),

      linkOAuthToAccount: (input: LinkOAuthToAccountInput): Promise<void> =>
        linkUC.execute(input),
    };
  },
};
