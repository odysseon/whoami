// Module factory and types
export {
  MagicLinkModule,
  type MagicLinkModuleConfig,
  type MagicLinkMethods,
} from "./magiclink.module.js";

// Derived types
export type {
  RequestMagicLinkInput,
  RequestMagicLinkOutput,
  RequestMagicLinkDeps,
  AuthenticateWithMagicLinkInput,
  AuthenticateWithMagicLinkOutput,
  AuthenticateWithMagicLinkDeps,
  MagicLinkConfig,
} from "./magiclink.config.js";

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
export type { MagicLinkTokenStore } from "./ports/magiclink-token-store.port.js";

// Use cases
export {
  RequestMagicLinkUseCase,
  AuthenticateWithMagicLinkUseCase,
} from "./use-cases/index.js";
