import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { ReceiptVerifier } from "@odysseon/whoami-core";
import { InvalidReceiptError } from "@odysseon/whoami-core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js";
import { AuthTokenExtractor } from "../extractors/auth-token-extractor.port.js";
import { WHOAMI_RECEIPT_VERIFIER } from "../tokens.js";
import type { RequestIdentity } from "../identity.js";

@Injectable()
export class WhoamiAuthGuard implements CanActivate {
  readonly #verifier: ReceiptVerifier;
  readonly #extractor: AuthTokenExtractor;
  readonly #reflector: Reflector;

  constructor(
    @Inject(WHOAMI_RECEIPT_VERIFIER)
    verifier: ReceiptVerifier,
    extractor: AuthTokenExtractor,
    reflector: Reflector,
  ) {
    this.#verifier = verifier;
    this.#extractor = extractor;
    this.#reflector = reflector;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.#reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      whoami?: { identity: RequestIdentity };
    }>();

    const token = this.#extractor.extract(request);
    if (!token) {
      throw new UnauthorizedException("Authentication required");
    }

    try {
      const receipt = await this.#verifier.verify(token);

      // Strip the token — only store safe identity fields
      request.whoami = {
        identity: {
          accountId: receipt.accountId,
          expiresAt: receipt.expiresAt,
        },
      };

      return true;
    } catch (err) {
      if (err instanceof InvalidReceiptError) {
        throw new UnauthorizedException("Invalid or expired token");
      }
      throw err;
    }
  }
}
