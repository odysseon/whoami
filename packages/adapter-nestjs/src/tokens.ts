import type { AuthModule } from "@odysseon/whoami-core";

/** Token for the receipt verifier port */
export const WHOAMI_RECEIPT_VERIFIER: unique symbol = Symbol(
  "WHOAMI_RECEIPT_VERIFIER",
);

/** Token prefix for auth module injection */
export const WHOAMI_MODULE_PREFIX = "WHOAMI_MODULE_" as const;

/** Build a token for a specific auth module kind */
export function moduleToken(kind: AuthModule["kind"]): string {
  return `${WHOAMI_MODULE_PREFIX}${kind.toUpperCase()}`;
}
