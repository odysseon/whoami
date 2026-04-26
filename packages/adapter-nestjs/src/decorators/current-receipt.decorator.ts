import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Receipt } from "@odysseon/whoami-core";

export const CurrentReceipt = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Receipt => {
    const request = ctx.switchToHttp().getRequest<{
      whoami?: { receipt: Receipt };
    }>();

    const receipt = request.whoami?.receipt;
    if (!receipt) {
      throw new Error(
        "CurrentReceipt used outside guarded route or before guard execution",
      );
    }

    return receipt;
  },
);
