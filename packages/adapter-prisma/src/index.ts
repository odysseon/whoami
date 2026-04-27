export { createPrismaAdapters, type PrismaAdapters } from "./factory.js";
export type { PrismaClientLike } from "./types.js";

// Individual stores (for access)
export { PrismaAccountRepository } from "./account.repository.js";
export { PrismaPasswordHashStore } from "./password-hash.store.js";
export { PrismaPasswordResetTokenStore } from "./password-reset-token.store.js";
export { PrismaOAuthCredentialStore } from "./oauth-credential.store.js";
export { PrismaMagicLinkTokenStore } from "./magiclink-token.store.js";
