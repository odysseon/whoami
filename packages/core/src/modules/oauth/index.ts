// Module factory and types
export {
  OAuthModule,
  type OAuthModuleConfig,
  type OAuthMethods,
} from "./oauth.module.js";

// Derived types
export type {
  AuthenticateWithOAuthInput,
  AuthenticateWithOAuthOutput,
  AuthenticateWithOAuthDeps,
  LinkOAuthToAccountInput,
  LinkOAuthToAccountOutput,
  LinkOAuthToAccountDeps,
  UnlinkOAuthProviderInput,
  UnlinkOAuthProviderDeps,
} from "./use-cases/index.js";

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
} from "./use-cases/index.js";
