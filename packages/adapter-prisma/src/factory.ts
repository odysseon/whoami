import { PrismaAccountRepository } from "./account.repository.js";
import { PrismaPasswordHashStore } from "./password-hash.store.js";
import { PrismaPasswordResetTokenStore } from "./password-reset-token.store.js";
import { PrismaOAuthCredentialStore } from "./oauth-credential.store.js";
import { PrismaMagicLinkTokenStore } from "./magiclink-token.store.js";
import type { PrismaClientLike } from "./types.js";

export interface PrismaAdapters {
  accountRepo: PrismaAccountRepository;
  passwordHashStore: PrismaPasswordHashStore;
  resetTokenStore: PrismaPasswordResetTokenStore;
  oauthStore: PrismaOAuthCredentialStore;
  magicLinkStore: PrismaMagicLinkTokenStore;
}

/**
 * Creates Prisma adapters for all whoami stores.
 *
 * @param prisma - A configured PrismaClient instance (Prisma 7+ with driver adapter)
 * @returns All adapters needed to configure whoami modules
 *
 * @example
 * ```typescript
 * import { PrismaClient } from "./generated/prisma";
 * import { PrismaPg } from "@prisma/adapter-pg";
 *
 * const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
 * const prisma = new PrismaClient({ adapter });
 *
 * const adapters = createPrismaAdapters(prisma);
 * ```
 */
export function createPrismaAdapters(prisma: PrismaClientLike): PrismaAdapters {
  return {
    accountRepo: new PrismaAccountRepository(prisma),
    passwordHashStore: new PrismaPasswordHashStore(prisma),
    resetTokenStore: new PrismaPasswordResetTokenStore(prisma),
    oauthStore: new PrismaOAuthCredentialStore(prisma),
    magicLinkStore: new PrismaMagicLinkTokenStore(prisma),
  };
}
