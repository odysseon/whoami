import { pathToFileURL } from "node:url";
import type { Server } from "node:http";
import {
  createAuth,
  IssueReceiptUseCase,
  VerifyReceiptUseCase,
} from "@odysseon/whoami-core";
import {
  JoseReceiptSigner,
  JoseReceiptVerifier,
} from "@odysseon/whoami-adapter-jose";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { createApp } from "./app.js";
import {
  InMemoryAccountRepository,
  InMemoryPasswordCredentialStore,
  InMemoryOAuthCredentialStore,
} from "./infrastructure/in-memory-repositories.js";
import { consoleLogger } from "./infrastructure/logger.js";
import { createIdGenerator } from "./infrastructure/id-generator.js";

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined)
    throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const JOSE_SECRET = env("JOSE_SECRET", "dev-secret-at-least-32-chars-long!!");
const joseConfig = { secret: JOSE_SECRET, issuer: "whoami-express-example" };

const receiptSigner = new JoseReceiptSigner(joseConfig);
const receiptVerifier = new JoseReceiptVerifier(joseConfig);
const passwordHasher = new Argon2PasswordHasher();
const accountRepo = new InMemoryAccountRepository();
const passwordStore = new InMemoryPasswordCredentialStore();
const oauthStore = new InMemoryOAuthCredentialStore();
const generateId = createIdGenerator();

const tokenSigner = new IssueReceiptUseCase({
  signer: receiptSigner,
  tokenLifespanMinutes: 60,
});
const verifyReceipt = new VerifyReceiptUseCase(receiptVerifier);

const auth = createAuth({
  accountRepo,
  tokenSigner,
  verifyReceipt,
  logger: consoleLogger,
  generateId,
  password: {
    hashManager: passwordHasher,
    passwordStore,
  },
  oauth: {
    oauthStore,
  },
});

const app = createApp({ auth, verifyReceipt, accountRepo });

export function startServer(port: number = 3000): Server {
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
  startServer(Number(env("PORT", "3000")));
}
