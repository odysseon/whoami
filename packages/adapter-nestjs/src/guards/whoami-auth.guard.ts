import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { VerifyReceiptUseCase } from "@odysseon/whoami-core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js";
import { AuthTokenExtractor } from "../extractors/auth-token-extractor.port.js";

/**
 * Global authentication guard for NestJS applications.
 *
 * Extracts the bearer token from every incoming request using the supplied
 * {@link AuthTokenExtractor}, verifies it via {@link VerifyReceiptUseCase},
 * and attaches the resulting `Receipt` to `request.identity`.
 *
 * Routes decorated with `@Public()` bypass verification entirely.
 *
 * @public
 */
@Injectable()
export class WhoamiAuthGuard implements CanActivate {
  constructor(
    private readonly verifyReceipt: VerifyReceiptUseCase,
    private readonly extractor: AuthTokenExtractor,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Record<string, unknown>>();

    const token = this.extractor.extract(request);

    if (!token) {
      throw new UnauthorizedException("No authentication token provided.");
    }

    try {
      const receipt = await this.verifyReceipt.execute(token);
      request["identity"] = receipt;
      return true;
    } catch {
      throw new UnauthorizedException(
        "Invalid or expired authentication token.",
      );
    }
  }
}
