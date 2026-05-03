// Use case classes
export { AuthenticateWithOAuthUseCase } from "./authenticate-with-oauth.use-case.js";
export { LinkOAuthToAccountUseCase } from "./link-oauth-to-account.use-case.js";
export { UnlinkOAuthProviderUseCase } from "./unlink-oauth-provider.use-case.js";

// All types derived from OAuthMethods — single source of truth lives in oauth.config.ts
export type {
  AccountDTO,
  AuthenticateWithOAuthInput,
  AuthenticateWithOAuthOutput,
  AuthenticateWithOAuthDeps,
  LinkOAuthToAccountInput,
  LinkOAuthToAccountOutput,
  LinkOAuthToAccountDeps,
  UnlinkOAuthProviderInput,
  UnlinkOAuthProviderDeps,
} from "../oauth.config.js";
