import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { IJwtPayload } from "@odysseon/whoami-core";

export const CurrentIdentity = createParamDecorator(
  (data: keyof IJwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const identity = request.identity as IJwtPayload;

    if (!identity) {
      // This technically shouldn't happen if the AuthGuard is active,
      // but it protects against runtime crashes on @Public() routes.
      return null;
    }

    // If the developer asked for a specific property (e.g., @CurrentIdentity('sub'))
    if (data) {
      return identity[data];
    }

    // Otherwise, return the entire decoded token payload
    return identity;
  },
);
