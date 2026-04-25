// Internal API — for adapter authors only.
// Application code must not import from this entry point.
//
// These concrete use-case classes are exposed so that adapter packages
// (e.g. @odysseon/whoami-adapter-nestjs) can wire them into DI containers
// via custom provider tokens.

// Password module use cases
export {
  RegisterWithPasswordUseCase,
  AuthenticateWithPasswordUseCase,
  ChangePasswordUseCase,
  AddPasswordToAccountUseCase,
  RequestPasswordResetUseCase,
  VerifyPasswordResetUseCase,
  RevokeAllPasswordResetsUseCase,
} from "../modules/password/use-cases/index.js";

// OAuth module use cases
export {
  AuthenticateWithOAuthUseCase,
  LinkOAuthToAccountUseCase,
  UnlinkOAuthProviderUseCase,
} from "../modules/oauth/use-cases/index.js";

// MagicLink module use cases
export {
  RequestMagicLinkUseCase,
  AuthenticateWithMagicLinkUseCase,
} from "../modules/magiclink/use-cases/index.js";
