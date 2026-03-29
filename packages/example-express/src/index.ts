import { pathToFileURL } from "node:url";
import type { Server } from "node:http";
import {
  RegisterAccountUseCase,
  VerifyPasswordUseCase,
  VerifyMagicLinkUseCase,
  AuthenticateOAuthUseCase,
  IssueReceiptUseCase,
  VerifyReceiptUseCase,
} from "@odysseon/whoami-core";
import {
  JoseReceiptSigner,
  JoseReceiptVerifier,
} from "@odysseon/whoami-adapter-jose";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { WebCryptoTokenHasher } from "@odysseon/whoami-adapter-webcrypto";
import { createApp } from "./app.js";
import {
  InMemoryAccountRepository,
  InMemoryCredentialStore,
} from "./infrastructure/in-memory-repositories.js";
import { consoleLogger } from "./infrastructure/logger.js";
import { createIdGenerator } from "./infrastructure/id-generator.js";

// Configuration
const JOSE_SECRET =
  process.env.JOSE_SECRET ?? "dev-secret-at-least-32-chars-long!!";
const joseConfig = { secret: JOSE_SECRET, issuer: "whoami-express-example" };

// Infrastructure
const receiptSigner = new JoseReceiptSigner(joseConfig);
const receiptVerifier = new JoseReceiptVerifier(joseConfig);
const passwordHasher = new Argon2PasswordHasher();
const tokenHasher = new WebCryptoTokenHasher();
const accountRepo = new InMemoryAccountRepository();
const credentialStore = new InMemoryCredentialStore();
const generateId = createIdGenerator();

// Use cases
const registerAccount = new RegisterAccountUseCase(accountRepo, generateId);
const verifyPassword = new VerifyPasswordUseCase({
  credentialStore,
  hasher: passwordHasher,
  logger: consoleLogger,
});
const verifyMagicLink = new VerifyMagicLinkUseCase({
  credentialStore,
  logger: consoleLogger,
});
const authenticateOAuth = new AuthenticateOAuthUseCase({
  accountRepository: accountRepo,
  credentialStore,
  generateId,
  logger: consoleLogger,
});
const issueReceipt = new IssueReceiptUseCase({
  signer: receiptSigner,
  tokenLifespanMinutes: 60,
});
const verifyReceipt = new VerifyReceiptUseCase(receiptVerifier);

// Create app with all dependencies
const app = createApp({
  registerAccount,
  verifyPassword,
  verifyMagicLink,
  authenticateOAuth,
  issueReceipt,
  verifyReceipt,
  credentialStore,
  accountRepo,
  passwordHasher,
  tokenHasher,
  generateId,
});

export function startServer(port: number = 3000): Server {
  const server = app.listen(port, () => {
    console.info(
      `[whoami] Express server listening on http://localhost:${port}`,
    );
    console.info(`[whoami] Swagger UI → http://localhost:${port}/docs`);
    console.info("[whoami] Routes:");
    console.info("  POST   /register");
    console.info("  POST   /login");
    console.info("  POST   /login/magic-link/request");
    console.info("  POST   /login/magic-link/verify");
    console.info("  POST   /login/oauth");
    console.info("  GET    /me");
  });
  return server;
}

const isMainModule =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  startServer(Number(process.env.PORT ?? "3000"));
}
