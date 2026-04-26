import { Inject, Injectable } from "@nestjs/common";
import type { OAuthMethods, Receipt } from "@odysseon/whoami-core";
import { moduleToken } from "../tokens.js";

export interface OAuthProfile {
  readonly email: string;
  readonly provider: string;
  readonly providerId: string;
}

@Injectable()
export class OAuthCallbackHandler {
  readonly #oauth: OAuthMethods;

  constructor(
    @Inject(moduleToken("oauth"))
    oauth: OAuthMethods,
  ) {
    this.#oauth = oauth;
  }

  async handle(profile: OAuthProfile): Promise<Receipt> {
    const result = await this.#oauth.authenticateWithOAuth({
      provider: profile.provider,
      providerId: profile.providerId,
      email: profile.email,
    });
    return result.receipt;
  }
}
