import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { DomainError } from "@odysseon/whoami-core";
import { type PasswordMethods } from "@odysseon/whoami-core/password";

export const createAccountsRouter = (password: PasswordMethods): Router => {
  const router = Router();

  router.post(
    "/register",
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

        const result = await password.registerWithPassword({
          email,
          password: plainPassword,
        });
        res.status(201).json({
          accountId: result.account.id,
          email: result.account.email,
        });
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
