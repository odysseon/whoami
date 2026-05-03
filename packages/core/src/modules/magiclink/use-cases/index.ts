// Use case classes
export { RequestMagicLinkUseCase } from "./request-magic-link.use-case.js";
export { AuthenticateWithMagicLinkUseCase } from "./authenticate-with-magic-link.use-case.js";

// All types derived from MagicLinkMethods — single source of truth lives in magiclink.config.ts
export type {
  RequestMagicLinkInput,
  RequestMagicLinkOutput,
  RequestMagicLinkDeps,
  AuthenticateWithMagicLinkInput,
  AuthenticateWithMagicLinkOutput,
  AuthenticateWithMagicLinkDeps,
} from "../magiclink.config.js";
