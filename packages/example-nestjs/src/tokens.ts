/**
 * DI injection tokens for @odysseon/whoami-example-nestjs.
 */
export const TOKENS = {
  ACCOUNT_REPOSITORY: Symbol("ACCOUNT_REPOSITORY"),
  PASSWORD_CREDENTIAL_STORE: Symbol("PASSWORD_CREDENTIAL_STORE"),
  OAUTH_CREDENTIAL_STORE: Symbol("OAUTH_CREDENTIAL_STORE"),
  AUTH: Symbol("AUTH"),
  LOGGER: Symbol("LOGGER"),
  GENERATE_ID: Symbol("GENERATE_ID"),
} as const;
