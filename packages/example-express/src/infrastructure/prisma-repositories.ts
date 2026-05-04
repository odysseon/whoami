/**
 * Prisma-backed repository wiring for example-express.
 */
import { createPrismaAdapters } from "@odysseon/whoami-adapter-prisma";
import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

// Create and configure the PrismaClient instance
const adapter = new PrismaPg({
  connectionString: process.env["DATABASE_URL"],
});

export const prisma = new PrismaClient({ adapter });

// Build adapters once (singleton)
const adapters = createPrismaAdapters(prisma);

export const prismaAdapters = {
  accountRepo: adapters.accountRepo,
  passwordHashStore: adapters.passwordHashStore,
  resetTokenStore: adapters.resetTokenStore,
  oauthStore: adapters.oauthStore,
  magicLinkStore: adapters.magicLinkStore,
};

// Export the factory function for flexibility
export { createPrismaAdapters };
