// Module factory and types
export {
  MagicLinkModule,
  type MagicLinkModuleConfig,
  type MagicLinkMethods,
} from "./magiclink.module.js";

// Entities
export {
  type MagicLinkProof,
  isMagicLinkProof,
  createMagicLinkProof,
  markMagicLinkAsUsed,
  isMagicLinkExpired,
  isMagicLinkUsed,
} from "./entities/magiclink.proof.js";

// Ports
export type { MagicLinkCredentialStore } from "./ports/magiclink-credential-store.port.js";

// Use cases
export {
  RequestMagicLinkUseCase,
  AuthenticateWithMagicLinkUseCase,
  type RequestMagicLinkInput,
  type RequestMagicLinkOutput,
  type MagicLinkConfig,
  type AuthenticateWithMagicLinkInput,
  type AuthenticateWithMagicLinkOutput,
  type AuthenticateWithMagicLinkConfig,
} from "./use-cases/index.js";
