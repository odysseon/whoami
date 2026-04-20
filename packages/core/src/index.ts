// Main entry point - createAuth factory
export {
  createAuth,
  type AuthConfig,
  type AuthMethods,
  type CoreAuthMethods,
} from "./create-auth.js";

// Kernel exports (domain, ports, shared utilities)
export * from "./kernel/index.js";

// Module exports (for consumers who need direct access)
export * from "./modules/password/index.js";
export * from "./modules/oauth/index.js";
export * from "./modules/magiclink/index.js";

// Module interface
export type {
  AuthModule,
  CredentialProofDeserializer,
  AuthModuleFactory,
} from "./modules/module.interface.js";
