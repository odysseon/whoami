import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import {
  DomainError,
  type RegisterAccountUseCase,
} from "@odysseon/whoami-core";
import type { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { Credential, CredentialId } from "@odysseon/whoami-core";
import type { InMemoryCredentialStore } from "../infrastructure/in-memory-repositories.js";

export const createAccountsRouter = (
  registerAccount: RegisterAccountUseCase,
  credentialStore: InMemoryCredentialStore,
  passwordHasher: Argon2PasswordHasher,
  generateId: () => number,
): Router => {
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

        const account = await registerAccount.execute(email);

        const hash = await passwordHasher.hash(password);
        const credentialId = new CredentialId(generateId());
        const credential = Credential.loadExisting(credentialId, account.id, {
          kind: "password",
          hash,
        });
        await credentialStore.saveWithEmail(credential, account.email);

        res
          .status(201)
          .json({ accountId: account.id.value, email: account.email.value });
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
