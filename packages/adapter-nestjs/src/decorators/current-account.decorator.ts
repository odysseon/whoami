import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AccountId, InvalidReceiptError } from "@odysseon/whoami-core";

/**
 * Resolves the verified AccountId from the current request.
 *
 * @remarks
 * Returns **only** the AccountId. The receipt has already been verified
 * by WhoamiAuthGuard, but this decorator performs a final expiry check
 * as defense in depth. If you need email, profile, or roles, fetch them
 * yourself using the returned AccountId.value as the foreign key.
 *
 * @throws Error if used outside a guarded route
 * @throws InvalidReceiptError if the receipt has expired
 */
export const CurrentAccount = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AccountId => {
    const request = ctx.switchToHttp().getRequest<{
      whoami?: { receipt: { accountId: AccountId; expiresAt: Date } };
    }>();

    const receipt = request.whoami?.receipt;
    if (!receipt) {
      throw new Error(
        "CurrentAccount used outside guarded route or before guard execution",
      );
    }

    if (receipt.expiresAt.getTime() < Date.now()) {
      throw new InvalidReceiptError("Receipt has expired.");
    }

    return receipt.accountId;
  },
);
