import type { IJwtPayload } from "@odysseon/whoami-core";

export type WhoamiRequestIdentity = IJwtPayload;

export interface WhoamiAuthenticatedRequest {
  user?: WhoamiRequestIdentity;
}
