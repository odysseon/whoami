import { pathToFileURL } from "node:url";
import type { Server } from "node:http";
import { PasswordModule, OAuthModule } from "@odysseon/whoami-core";
import {
  JoseReceiptSigner,
  JoseReceiptVerifier,
} from "@odysseon/whoami-adapter-jose";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { WebCryptoSecureTokenAdapter } from "@odysseon/whoami-adapter-webcrypto";
import { createApp } from "./app.js";
import {
  InMemoryAccountRepository,
  InMemoryPasswordCredentialStore,
  InMemoryOAuthCredentialStore,
} from "./infrastructure/in-memory-repositories.js";
import { UuidGenerator } from "./infrastructure/id-generator.js";
import { consoleLogger } from "./infrastructure/logger.js";
import { env, SystemClock } from "./utils.js";

const JOSE_SECRET = env("JOSE_SECRET", "dev-secret-at-least-32-chars-long!!");
const joseConfig = { secret: JOSE_SECRET, issuer: "whoami-express-example" };

// Create the ports
const receiptSigner = new JoseReceiptSigner(joseConfig);
const receiptVerifier = new JoseReceiptVerifier(joseConfig);
const passwordHasher = new Argon2PasswordHasher();
const accountRepo = new InMemoryAccountRepository();
const passwordStore = new InMemoryPasswordCredentialStore();
const oauthStore = new InMemoryOAuthCredentialStore();
const secureToken = new WebCryptoSecureTokenAdapter();
const idGenerator = new UuidGenerator();
const resetTokenLifespanMinutes = 15;
const tokenLifespanMinutes = 60;
const logger = consoleLogger;
const clock = new SystemClock();

// Create fully-typed module facades — no type erasure
const password = PasswordModule({
  accountRepo,
  passwordHasher,
  passwordStore,
  receiptSigner,
  logger,
  resetTokenLifespanMinutes,
  tokenLifespanMinutes,
  secureToken,
  idGenerator,
  clock,
});

const oauth = OAuthModule({
  accountRepo,
  oauthStore,
  receiptSigner,
  idGenerator,
  logger,
  tokenLifespanMinutes,
});

const app = createApp({ password, oauth, receiptVerifier, accountRepo });

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
