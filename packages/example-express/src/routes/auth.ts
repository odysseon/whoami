import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { DomainError } from "@odysseon/whoami-core";
import type { PasswordMethods } from "@odysseon/whoami-core/password";
import type { OAuthMethods } from "@odysseon/whoami-core/oauth";
import type { MagicLinkMethods } from "@odysseon/whoami-core/magiclink";

export const createAuthRouter = (
  password: PasswordMethods,
  oauth: OAuthMethods,
  magicLink: MagicLinkMethods,
): Router => {
  const router = Router();

  // POST /login
  router.post(
    "/",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { email, password: plainPassword } = req.body as {
          email?: string;
          password?: string;
        };
        if (!email || !plainPassword) {
          res.status(400).json({ error: "email and password are required." });
          return;
        }

        const result = await password.authenticateWithPassword({
          email,
          password: plainPassword,
        });
        res.json({
          token: result.receipt.token,
          expiresAt: result.receipt.expiresAt,
        });
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

        const result = await oauth.authenticateWithOAuth({
          email,
          provider,
          providerId,
        });
        res.json({
          token: result.receipt.token,
          expiresAt: result.receipt.expiresAt,
        });
      } catch (err) {
        if (err instanceof DomainError) {
          res.status(401).json({ error: err.message });
          return;
        }
        next(err);
      }
    },
  );

  // POST /login/magic-link/request
  router.post(
    "/magic-link/request",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { email } = req.body as { email?: string };
        if (!email) {
          res.status(400).json({ error: "email is required." });
          return;
        }

        const result = await magicLink.requestMagicLink({ email });

        // In production, email the token. Here we return it for demo.
        res.json({
          message: "Magic link issued.",
          magicLinkToken: result.plainTextToken,
          expiresAt: result.expiresAt,
          isNewAccount: result.isNewAccount,
          note: "demo only — never expose tokens in production",
        });
      } catch (err) {
        if (err instanceof DomainError) {
          res.status(400).json({ error: err.message });
          return;
        }
        next(err);
      }
    },
  );

  // POST /login/magic-link/verify
  router.post(
    "/magic-link/verify",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { token } = req.body as { token?: string };
        if (!token) {
          res.status(400).json({ error: "token is required." });
          return;
        }

        const result = await magicLink.authenticateWithMagicLink({ token });
        res.json({
          token: result.receipt.token,
          expiresAt: result.receipt.expiresAt,
        });
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
