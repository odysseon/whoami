import express, {
  type Request,
  type Response,
  type NextFunction,
  type Express,
} from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { DomainError } from "@odysseon/whoami-core";
import { swaggerOptions } from "./swagger.js";
import { createAccountsRouter } from "./routes/accounts.js";
import { createAuthRouter } from "./routes/auth.js";
import { createIdentityRouter } from "./routes/identity.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import type {
  RegisterAccountUseCase,
  VerifyPasswordUseCase,
  VerifyMagicLinkUseCase,
  AuthenticateOAuthUseCase,
  IssueReceiptUseCase,
  VerifyReceiptUseCase,
} from "@odysseon/whoami-core";
import type { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import type { WebCryptoTokenHasher } from "@odysseon/whoami-adapter-webcrypto";
import type {
  InMemoryAccountRepository,
  InMemoryCredentialStore,
} from "./infrastructure/in-memory-repositories.js";

interface AppDependencies {
  registerAccount: RegisterAccountUseCase;
  verifyPassword: VerifyPasswordUseCase;
  verifyMagicLink: VerifyMagicLinkUseCase;
  authenticateOAuth: AuthenticateOAuthUseCase;
  issueReceipt: IssueReceiptUseCase;
  verifyReceipt: VerifyReceiptUseCase;
  credentialStore: InMemoryCredentialStore;
  accountRepo: InMemoryAccountRepository;
  passwordHasher: Argon2PasswordHasher;
  tokenHasher: WebCryptoTokenHasher;
  generateId: () => number;
}

export const createApp = (dependencies: AppDependencies): Express => {
  const app = express();
  app.use(express.json());

  // Swagger UI
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/docs.json", (_req: Request, res: Response): void => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // Auth middleware
  const authMiddleware = createAuthMiddleware(dependencies.verifyReceipt);

  // Routes
  app.use(
    createAccountsRouter(
      dependencies.registerAccount,
      dependencies.credentialStore,
      dependencies.passwordHasher,
      dependencies.generateId,
    ),
  );

  app.use(
    "/login",
    createAuthRouter(
      dependencies.verifyPassword,
      dependencies.verifyMagicLink,
      dependencies.authenticateOAuth,
      dependencies.issueReceipt,
      dependencies.credentialStore,
      dependencies.accountRepo,
      dependencies.tokenHasher,
      dependencies.generateId,
    ),
  );

  app.use(createIdentityRouter(dependencies.accountRepo, authMiddleware));

  // Error handling
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof DomainError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  });

  return app;
};
