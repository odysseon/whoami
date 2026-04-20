// Module factory and types
export {
  OAuthModule,
  type OAuthModuleConfig,
  type OAuthMethods,
} from "./oauth.module.js";

// Entities
export {
  type OAuthProof,
  isOAuthProof,
  createOAuthProof,
} from "./entities/oauth.proof.js";

// Ports
export type { OAuthCredentialStore } from "./ports/oauth-credential-store.port.js";

// Use cases
export {
  AuthenticateWithOAuthUseCase,
  LinkOAuthToAccountUseCase,
  UnlinkOAuthProviderUseCase,
  type AuthenticateWithOAuthInput,
  type AuthenticateWithOAuthOutput,
  type LinkOAuthToAccountInput,
  type LinkOAuthToAccountOutput,
  type UnlinkOAuthProviderInput,
  type UnlinkOAuthProviderOutput,
} from "./use-cases/index.js";
