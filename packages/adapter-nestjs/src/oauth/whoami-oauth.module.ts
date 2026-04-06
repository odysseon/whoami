import { Module } from "@nestjs/common";
import { OAuthCallbackHandler } from "./oauth-callback-handler.js";

/**
 * NestJS integration module for the OAuth authentication flow.
 *
 * Provides {@link OAuthCallbackHandler} as an injectable service.
 * Import this module in any feature module that handles OAuth callbacks.
 *
 * ### Prerequisites
 * `WhoamiOAuthModule` expects `AuthenticateOAuthUseCase` to be available in
 * the NestJS DI container. Ensure your auth module registers and exports it
 * before importing `WhoamiOAuthModule`.
 *
 * @example
 * ```ts
 * \@Module({
 *   imports: [WhoamiOAuthModule],
 *   controllers: [OAuthController],
 * })
 * export class OAuthModule {}
 * ```
 *
 * @public
 */
@Module({
  providers: [OAuthCallbackHandler],
  exports: [OAuthCallbackHandler],
})
export class WhoamiOAuthModule {}
