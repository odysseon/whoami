import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Receipt, ReceiptVerifier } from "@odysseon/whoami-core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js";
import type { AuthTokenExtractor } from "../extractors/auth-token-extractor.port.js";
import { BearerTokenExtractor } from "../extractors/bearer-token.extractor.js";
import { WHOAMI_RECEIPT_VERIFIER } from "../whoami.module.js";

type RequestWithIdentity = {
  identity?: Receipt;
};

/**
 * NestJS guard that enforces receipt-based authentication on every route.
 *
 * Routes decorated with {@link Public} are skipped entirely.
 * All other routes require a valid bearer token in the `Authorization` header.
 *
 * On success the verified {@link Receipt} is attached to `request.identity`
 * for downstream access via the {@link CurrentIdentity} decorator.
 *
 * ### Registration (global, recommended)
 * ```ts
 * // In your module providers:
 * { provide: APP_GUARD, useClass: WhoamiAuthGuard }
 * ```
 *
 * @public
 */
@Injectable()
export class WhoamiAuthGuard implements CanActivate {
  private readonly logger = new Logger(WhoamiAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(WHOAMI_RECEIPT_VERIFIER)
    private readonly receiptVerifier: ReceiptVerifier,
    private readonly tokenExtractor: BearerTokenExtractor,
  ) {}

  /**
   * Determines whether the current request is allowed to proceed.
   *
   * @param context - The execution context for the current request.
   * @returns `true` when the request is authenticated or the route is public.
   * @throws {UnauthorizedException} When the token is absent or verification fails.
   */
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<RequestWithIdentity & unknown>();

    const token = (this.tokenExtractor as AuthTokenExtractor).extract(request);

    if (!token) {
      throw new UnauthorizedException(
        "Missing or malformed Authorization header.",
      );
    }

    try {
      const receipt = await this.receiptVerifier.verify(token);
      (request as RequestWithIdentity).identity = receipt;
      return true;
    } catch (err) {
      this.logger.debug(
        `Receipt verification failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new UnauthorizedException("Invalid or expired receipt token.");
    }
  }
}
