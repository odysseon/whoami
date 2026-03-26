import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import {
  WhoamiService,
  WhoamiError,
  type IJwtPayload,
  type ITokenExtractor,
} from "@odysseon/whoami-core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js";

// We export this token so the Module can wire it up
export const WHOAMI_TOKEN_EXTRACTOR = "WHOAMI_TOKEN_EXTRACTOR";

export interface AuthenticatedRequest extends Request {
  identity?: IJwtPayload;
}

@Injectable()
export class WhoamiAuthGuard implements CanActivate {
  constructor(
    private readonly whoamiService: WhoamiService,
    private readonly reflector: Reflector,
    @Inject(WHOAMI_TOKEN_EXTRACTOR) private readonly extractor: ITokenExtractor,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // Delegate the extraction to the injected utility!
    const token = this.extractor.extract(request);

    if (!token) {
      throw new WhoamiError("MISSING_TOKEN", "No bearer token provided.");
    }

    const payload = await this.whoamiService.verifyAccessToken(token);
    request.identity = payload;

    return true;
  }
}
