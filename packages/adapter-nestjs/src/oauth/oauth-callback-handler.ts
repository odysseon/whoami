import { Inject, Injectable } from "@nestjs/common";
import {
  InvalidConfigurationError,
  type OAuthMethods,
  type ReceiptDTO,
} from "@odysseon/whoami-core";
import { moduleToken } from "../tokens.js";

export interface OAuthProfile {
  readonly email: string;
  readonly provider: string;
  readonly providerId: string;
}

@Injectable()
export class OAuthCallbackHandler {
  readonly #oauth: OAuthMethods | null;

  constructor(
    @Inject(moduleToken("oauth"))
    oauth: OAuthMethods | null,
  ) {
    this.#oauth = oauth;
  }

  async handle(profile: OAuthProfile): Promise<ReceiptDTO> {
    if (!this.#oauth) {
      throw new InvalidConfigurationError(
        "OAuth module not configured. Please include OAuthModule in WhoamiModule options.",
      );
    }
    const result = await this.#oauth.authenticateWithOAuth({
      provider: profile.provider,
      providerId: profile.providerId,
      email: profile.email,
    });
    return result.receipt;
  }
}
