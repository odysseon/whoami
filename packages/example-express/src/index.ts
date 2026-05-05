import "dotenv/config";
import { pathToFileURL } from "node:url";
import type { Server } from "node:http";
import { PasswordModule } from "@odysseon/whoami-core/password";
import { OAuthModule } from "@odysseon/whoami-core/oauth";
import { MagicLinkModule } from "@odysseon/whoami-core/magiclink";
import {
  JoseReceiptSigner,
  JoseReceiptVerifier,
} from "@odysseon/whoami-adapter-jose";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { WebCryptoSecureTokenAdapter } from "@odysseon/whoami-adapter-webcrypto";
import { createApp } from "./app.js";
import { UuidGenerator } from "./infrastructure/id-generator.js";
import { consoleLogger } from "./infrastructure/logger.js";
import { env, SystemClock } from "./utils.js";
import { prismaAdapters } from "./infrastructure/prisma-repositories.js";

const JOSE_SECRET = env("JOSE_SECRET", "dev-secret-at-least-32-chars-long!!");
const joseConfig = { secret: JOSE_SECRET, issuer: "whoami-express-example" };

// Create the ports
const receiptSigner = new JoseReceiptSigner(joseConfig);
const receiptVerifier = new JoseReceiptVerifier(joseConfig);
const passwordHasher = new Argon2PasswordHasher();
const secureToken = new WebCryptoSecureTokenAdapter();
const idGenerator = new UuidGenerator();
const resetTokenLifespanMinutes = 15;
const tokenLifespanMinutes = 60;
const magicLinkLifespanMinutes = 15;
const logger = consoleLogger;
const clock = new SystemClock();

// Create fully-typed module facades — no type erasure
const password = PasswordModule({
  accountRepo: prismaAdapters.accountRepo,
  passwordHasher,
  passwordHashStore: prismaAdapters.passwordHashStore,
  resetTokenStore: prismaAdapters.resetTokenStore,
  receiptSigner,
  logger,
  resetTokenLifespanMinutes,
  tokenLifespanMinutes,
  secureToken,
  idGenerator,
  clock,
});

const oauth = OAuthModule({
  accountRepo: prismaAdapters.accountRepo,
  oauthStore: prismaAdapters.oauthStore,
  receiptSigner,
  idGenerator,
  logger,
  tokenLifespanMinutes,
});

const magicLink = MagicLinkModule({
  accountRepo: prismaAdapters.accountRepo,
  magicLinkStore: prismaAdapters.magicLinkStore,
  receiptSigner,
  idGenerator,
  logger,
  clock,
  secureToken,
  tokenLifespanMinutes: magicLinkLifespanMinutes,
});

const app = createApp({
  password,
  oauth,
  magicLink,
  receiptVerifier,
  accountRepo: prismaAdapters.accountRepo,
});

export function startServer(port: number): Server {
  const server = app.listen(port, () => {
    console.info(
      `[whoami] Express server listening on http://localhost:${port}`,
    );
    console.info(`[whoami] Swagger UI → http://localhost:${port}/docs`);
    console.info("[whoami] Routes:");
    console.info("  POST   /register");
    console.info("  POST   /login");
    console.info("  POST   /login/oauth");
    console.info("  POST   /login/magic-link/request");
    console.info("  POST   /login/magic-link/verify");
    console.info("  GET    /me");
  });
  return server;
}

const isMainModule =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  startServer(Number(env("PORT", "3030")));
}
