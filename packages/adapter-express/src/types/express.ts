import type { AccountId } from "@odysseon/whoami-core";

export interface RequestIdentity {
  readonly accountId: AccountId;
  readonly expiresAt: Date;
}

declare module "express" {
  interface Request {
    identity?: RequestIdentity;
    accountId?: AccountId;
  }
}
