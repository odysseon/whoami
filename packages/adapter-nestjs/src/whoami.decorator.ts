import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { WhoamiAuthenticatedRequest } from "./whoami-auth.types.js";

export const WhoamiIdentity = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context
      .switchToHttp()
      .getRequest<WhoamiAuthenticatedRequest>();

    return request.user;
  },
);
