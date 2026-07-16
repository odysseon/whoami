import type { AuthModule } from "@odysseon/whoami-core";

/** Token for the receipt verifier port */
export const WHOAMI_RECEIPT_VERIFIER: unique symbol = Symbol(
  "WHOAMI_RECEIPT_VERIFIER",
);

/** Token for the account query port */
export const WHOAMI_ACCOUNT_QUERY: unique symbol = Symbol(
  "WHOAMI_ACCOUNT_QUERY",
);

/** Token for the constructed receipt authenticator */
export const WHOAMI_RECEIPT_AUTHENTICATOR: unique symbol = Symbol(
  "WHOAMI_RECEIPT_AUTHENTICATOR",
);

/** Token prefix for auth module injection */
export const WHOAMI_MODULE_PREFIX = "WHOAMI_MODULE_" as const;

/** Build a token for a specific auth module kind */
export function moduleToken(kind: AuthModule["kind"]): string {
  return `${WHOAMI_MODULE_PREFIX}${kind.toUpperCase()}`;
}
