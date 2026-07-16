import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AuthenticateWithReceiptUseCase } from "@odysseon/whoami-core";
import {
  InvalidReceiptError,
  AuthenticationError,
} from "@odysseon/whoami-core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js";
import { IS_OPTIONAL_AUTH_KEY } from "../decorators/optional-auth.decorator.js";
import { AuthTokenExtractor } from "../extractors/auth-token-extractor.port.js";
import { WHOAMI_RECEIPT_AUTHENTICATOR } from "../tokens.js";
import type { RequestIdentity } from "../identity.js";

@Injectable()
export class WhoamiAuthGuard implements CanActivate {
  readonly #authenticator: AuthenticateWithReceiptUseCase;
  readonly #extractor: AuthTokenExtractor;
  readonly #reflector: Reflector;

  constructor(
    @Inject(WHOAMI_RECEIPT_AUTHENTICATOR)
    authenticator: AuthenticateWithReceiptUseCase,
    extractor: AuthTokenExtractor,
    reflector: Reflector,
  ) {
    this.#authenticator = authenticator;
    this.#extractor = extractor;
    this.#reflector = reflector;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.#reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const isOptionalAuth = this.#reflector.getAllAndOverride<boolean>(
      IS_OPTIONAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      whoami?: { identity: RequestIdentity };
    }>();

    const token = this.#extractor.extract(request);
    if (!token) {
      if (isOptionalAuth) return true;
      throw new UnauthorizedException("Authentication required");
    }

    try {
      const identity = await this.#authenticator.execute(token);

      request.whoami = { identity };

      return true;
    } catch (err) {
      if (
        err instanceof InvalidReceiptError ||
        err instanceof AuthenticationError
      ) {
        throw new UnauthorizedException("Invalid or expired token");
      }
      throw err;
    }
  }
}
