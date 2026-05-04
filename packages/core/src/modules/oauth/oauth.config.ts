import type { OAuthModuleDeps } from "./oauth.deps.js";

export interface OAuthModuleConfig extends OAuthModuleDeps {
  readonly tokenLifespanMinutes?: number;
}

export type {
  OAuthModuleDeps,
  AuthenticateWithOAuthDeps,
  LinkOAuthToAccountDeps,
  UnlinkOAuthProviderDeps,
} from "./oauth.deps.js";

export type { OAuthMethods } from "./oauth.methods.js";

export type {
  AuthenticateWithOAuthInput,
  AuthenticateWithOAuthOutput,
  LinkOAuthToAccountInput,
  LinkOAuthToAccountOutput,
  UnlinkOAuthProviderInput,
} from "./oauth.types.js";
