import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import {
  InvalidReceiptError,
  Receipt,
  VerifyReceiptUseCase,
} from "@odysseon/whoami-core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js";
import type { AuthTokenExtractor } from "../extractors/auth-token-extractor.port.js";

export const WHOAMI_TOKEN_EXTRACTOR = "WHOAMI_TOKEN_EXTRACTOR";

export interface AuthenticatedRequest extends Request {
  identity?: Receipt;
}

/**
 * Protects NestJS routes by requiring a valid receipt token.
 */
@Injectable()
export class WhoamiAuthGuard implements CanActivate {
  constructor(
    private readonly verifyReceipt: VerifyReceiptUseCase,
    private readonly reflector: Reflector,
    @Inject(WHOAMI_TOKEN_EXTRACTOR)
    private readonly extractor: AuthTokenExtractor,
  ) {}

  /**
   * Resolves the current route's authentication state.
   *
   * @param context - The NestJS execution context.
   * @returns `true` when the request may proceed.
   * @throws {InvalidReceiptError} When the token is missing or invalid.
   */
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractor.extract(request);

    if (!token) {
      throw new InvalidReceiptError("No bearer token provided.");
    }

    request.identity = await this.verifyReceipt.execute(token);

    return true;
  }
}
