import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import type { Receipt } from "@odysseon/whoami-core";
import type { InMemoryAccountRepository } from "../infrastructure/in-memory-repositories.js";

interface AuthenticatedRequest extends Request {
  identity?: Receipt;
}

export const createIdentityRouter = (
  accountRepo: InMemoryAccountRepository,
  authMiddleware: (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => Promise<void>,
): Router => {
  const router = Router();

  router.get(
    "/me",
    authMiddleware,
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        if (!req.identity) {
          res.status(401).json({ error: "Not authenticated" });
          return;
        }

        const account = await accountRepo.findById(req.identity.accountId);

        res.json({
          accountId: req.identity.accountId.value,
          email: account?.email.value ?? null,
          tokenExpiresAt: req.identity.expiresAt,
        });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
};
