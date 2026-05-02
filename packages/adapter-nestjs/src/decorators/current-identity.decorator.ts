import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { RequestIdentity } from "../identity.js";

export const CurrentIdentity = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestIdentity => {
    const request = ctx.switchToHttp().getRequest<{
      whoami?: { identity: RequestIdentity };
    }>();

    const identity = request.whoami?.identity;
    if (!identity) {
      throw new Error(
        "CurrentIdentity used outside guarded route or before guard execution",
      );
    }

    return identity;
  },
);
