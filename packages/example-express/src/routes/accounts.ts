import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { DomainError, type AnyAuthMethods } from "@odysseon/whoami-core";

export const createAccountsRouter = (auth: AnyAuthMethods): Router => {
  const router = Router();

  router.post(
    "/register",
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

        const receipt = await auth.registerWithPassword!({ email, password });
        res
          .status(201)
          .json({ token: receipt.token, expiresAt: receipt.expiresAt });
      } catch (err) {
        if (err instanceof DomainError) {
          res.status(409).json({ error: err.message });
          return;
        }
        next(err);
      }
    },
  );

  return router;
};
