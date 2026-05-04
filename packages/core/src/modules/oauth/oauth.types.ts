import type { AccountId } from "../../kernel/domain/value-objects/index.js";
import type { OAuthMethods } from "./oauth.methods.js";

export type AuthenticateWithOAuthInput = Parameters<
  OAuthMethods["authenticateWithOAuth"]
>[0];
export type AuthenticateWithOAuthOutput = Awaited<
  ReturnType<OAuthMethods["authenticateWithOAuth"]>
>;

export type LinkOAuthToAccountInput = {
  readonly accountId: AccountId;
  readonly provider: string;
  readonly providerId: string;
};

export type LinkOAuthToAccountOutput = Awaited<
  ReturnType<OAuthMethods["linkOAuthToAccount"]>
>;

export type UnlinkOAuthProviderInput = {
  readonly accountId: AccountId;
  readonly provider: string;
};
