import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AccountId } from "@odysseon/whoami-core";

export const CurrentAccount = createParamDecorator(
  (
    data: keyof { id: AccountId; email: string; createdAt: Date } | undefined,
    ctx: ExecutionContext,
  ) => {
    const request = ctx.switchToHttp().getRequest<{
      whoami?: { receipt: { accountId: AccountId; expiresAt: Date } };
    }>();

    const receipt = request.whoami?.receipt;
    if (!receipt) {
      throw new Error(
        "CurrentAccount used outside guarded route or before guard execution",
      );
    }

    // Return lightweight account proxy from receipt
    const account = {
      id: receipt.accountId,
      email: receipt.accountId, // Note: receipt doesn't carry email; hydration needed
      createdAt: new Date(), // Placeholder — full hydration via AccountRepository
    };

    return data ? account[data] : account;
  },
);
