import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from "@nestjs/common";
import {
  WhoamiError,
  WhoamiService,
  type ITokenExtractor,
} from "@odysseon/whoami-core";
import { WHOAMI_TOKEN_EXTRACTOR } from "./constants.js";
import { mapWhoamiError } from "./whoami-error.mapper.js";
import type {
  WhoamiAuthenticatedRequest,
  WhoamiRequestIdentity,
} from "./whoami-auth.types.js";

@Injectable()
export class WhoamiAuthGuard implements CanActivate {
  constructor(
    private readonly whoamiService: WhoamiService,
    @Inject(WHOAMI_TOKEN_EXTRACTOR)
    private readonly tokenExtractor: ITokenExtractor,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<WhoamiAuthenticatedRequest>();
    const accessToken = this.tokenExtractor.extract(request);

    if (!accessToken) {
      throw mapWhoamiError(
        new WhoamiError("MISSING_TOKEN", "Access token is required."),
      );
    }

    try {
      const payload = await this.whoamiService.verifyAccessToken(accessToken);
      const identity: WhoamiRequestIdentity = payload;
      request.user = identity;
      return true;
    } catch (error) {
      if (error instanceof WhoamiError) {
        throw mapWhoamiError(error);
      }

      throw error;
    }
  }
}
