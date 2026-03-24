export const VERSION = "0.1.0";
// Errors
export * from "./errors/whoami-error.js";

// Identity Models
export type * from "./interfaces/models/user.interface.js";
export type * from "./interfaces/models/refresh-token.interface.js";
export type * from "./interfaces/models/jwt-payload.interface.js";

// Security Ports
export type * from "./interfaces/ports/security/password-hasher.port.js";
export type * from "./interfaces/ports/security/deterministic-token-hasher.port.js";
export type * from "./interfaces/ports/security/token-signer.port.js";

// Repository Ports
export type * from "./interfaces/ports/repositories/user-repository.port.js";
export type * from "./interfaces/ports/repositories/refresh-token-repository.port.js";

// Utility Ports
export type * from "./interfaces/ports/utilities/token-extractor.port.js";
export type * from "./interfaces/ports/utilities/logger.port.js";

// Operation Contracts
export type * from "./interfaces/operation-contracts/auth-tokens.interface.js";
export type * from "./interfaces/operation-contracts/login-credentials.interface.js";
export type * from "./interfaces/operation-contracts/register-data.interface.js";

// Core Service
export { WhoamiService } from "./core/whoami.service.js";
export type { WhoamiServiceDependencies } from "./core/whoami.service.js";

// Adapters
export { JoseTokenSigner } from "./adapters/security/jose-token-signer.adapter.js";
export type { JoseSignerConfig } from "./adapters/security/jose-token-signer.adapter.js";
export { CryptoTokenHasher } from "./adapters/security/crypto-token-hasher.adapter.js";
