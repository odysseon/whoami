import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from "express";
import "@odysseon/whoami-adapter-express";
import type { AccountRepository } from "@odysseon/whoami-core";

export const createIdentityRouter = (
  accountRepo: AccountRepository,
  authMiddleware: RequestHandler,
): Router => {
  const router = Router();

  router.get(
    "/me",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.identity) {
          res.status(401).json({ error: "Not authenticated" });
          return;
        }

        const account = await accountRepo.findById(req.identity.accountId);

        res.json({
          accountId: req.identity.accountId,
          email: account?.email ?? null,
          tokenExpiresAt: req.identity.expiresAt,
        });
      } catch (err) {
        next(err instanceof Error ? err : new Error(String(err)));
      }
    },
  );

  return router;
};
