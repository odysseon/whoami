import { DomainError } from "../domain-error.js";

/**
 * Thrown when removing an OAuth provider that is not linked to the account
 */
export class OAuthProviderNotFoundError extends DomainError {
  readonly code = "OAUTH_PROVIDER_NOT_FOUND";
  readonly statusCode = 404;

  constructor(provider: string) {
    super(`OAuth provider not found: ${provider}`);
  }
}
