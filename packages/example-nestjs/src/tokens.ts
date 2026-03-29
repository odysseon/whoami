/**
 * DI injection tokens for @odysseon/whoami-example-nestjs.
 *
 * Using typed symbols avoids the plain-string token anti-pattern and
 * eliminates the risk of silent collisions across modules.
 */
export const TOKENS = {
  ACCOUNT_REPOSITORY: Symbol("ACCOUNT_REPOSITORY"),
  CREDENTIAL_STORE: Symbol("CREDENTIAL_STORE"),
  LOGGER: Symbol("LOGGER"),
  GENERATE_ID: Symbol("GENERATE_ID"),
} as const;
