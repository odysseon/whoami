import express, {
  type Request,
  type Response,
  type NextFunction,
  type Express,
} from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { DomainError, type AuthMethods } from "@odysseon/whoami-core";
import type { VerifyReceiptUseCase } from "@odysseon/whoami-core/internal";
import { swaggerOptions } from "./swagger.js";
import { createAccountsRouter } from "./routes/accounts.js";
import { createAuthRouter } from "./routes/auth.js";
import { createIdentityRouter } from "./routes/identity.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import type { AccountRepository } from "@odysseon/whoami-core";

interface AppDependencies {
  auth: AuthMethods;
  verifyReceipt: VerifyReceiptUseCase;
  accountRepo: AccountRepository;
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

  const authMiddleware = createAuthMiddleware(dependencies.verifyReceipt);

  app.use(createAccountsRouter(dependencies.auth));
  app.use("/login", createAuthRouter(dependencies.auth));
  app.use(createIdentityRouter(dependencies.accountRepo, authMiddleware));

  // Error handler
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
