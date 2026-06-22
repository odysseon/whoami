import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { RequestIdentity } from "../identity.js";

export const CurrentIdentity = createParamDecorator(
  (
    data: { required?: boolean } | undefined,
    ctx: ExecutionContext,
  ): RequestIdentity | undefined => {
    const isRequired = data?.required ?? true;
    const request = ctx.switchToHttp().getRequest<{
      whoami?: { identity: RequestIdentity };
    }>();

    const identity = request.whoami?.identity;
    if (!identity && isRequired) {
      throw new Error(
        "CurrentIdentity used outside guarded route or before guard execution",
      );
    }

    return identity;
  },
);
