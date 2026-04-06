import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { DomainError, type AuthMethods } from "@odysseon/whoami-core";

export const createAuthRouter = (auth: AuthMethods): Router => {
  const router = Router();

  // POST /login
  router.post(
    "/",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { email, password } = req.body as {
          email?: string;
          password?: string;
        };
        if (!email || !password) {
          res.status(400).json({ error: "email and password are required." });
          return;
        }

        const receipt = await auth.authenticateWithPassword!({
          email,
          password,
        });
        res.json({ token: receipt.token, expiresAt: receipt.expiresAt });
      } catch (err) {
        if (err instanceof DomainError) {
          res.status(401).json({ error: err.message });
          return;
        }
        next(err);
      }
    },
  );

  // POST /login/oauth
  router.post(
    "/oauth",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { email, provider, providerId } = req.body as {
          email?: string;
          provider?: string;
          providerId?: string;
        };
        if (!email || !provider || !providerId) {
          res
            .status(400)
            .json({ error: "email, provider and providerId are required." });
          return;
        }

        const receipt = await auth.authenticateWithOAuth!({
          email,
          provider,
          providerId,
        });
        res.json({ token: receipt.token, expiresAt: receipt.expiresAt });
      } catch (err) {
        if (err instanceof DomainError) {
          res.status(401).json({ error: err.message });
          return;
        }
        next(err);
      }
    },
  );

  return router;
};
