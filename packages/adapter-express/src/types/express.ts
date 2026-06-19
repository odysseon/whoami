import type { Receipt } from "@odysseon/whoami-core";

declare module "express" {
  interface Request {
    identity?: Receipt;
    accountId?: string;
  }
}
