import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Receipt } from "@odysseon/whoami-core";

/**
 * Resolves the verified receipt stored by `WhoamiAuthGuard`.
 */
export const CurrentIdentity = createParamDecorator(
  (data: keyof Receipt | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{
      identity?: Receipt;
    }>();
    const { identity } = request;

    if (!identity) {
      return null;
    }

    if (data) {
      return identity[data];
    }

    return identity;
  },
);
