import type { MagicLinkModuleDeps } from "./magiclink.deps.js";

export interface MagicLinkModuleConfig extends MagicLinkModuleDeps {
  readonly tokenLifespanMinutes?: number;
  readonly receiptLifespanMinutes?: number;
}

export type {
  MagicLinkModuleDeps,
  MagicLinkConfig,
  RequestMagicLinkDeps,
  AuthenticateWithMagicLinkDeps,
} from "./magiclink.deps.js";

export type { MagicLinkMethods } from "./magiclink.methods.js";

export type {
  RequestMagicLinkInput,
  RequestMagicLinkOutput,
  AuthenticateWithMagicLinkInput,
  AuthenticateWithMagicLinkOutput,
} from "./magiclink.types.js";
