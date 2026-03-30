import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import {
  DomainError,
  EmailAddress,
  Credential,
  CredentialId,
  type VerifyPasswordUseCase,
  type VerifyMagicLinkUseCase,
  type AuthenticateOAuthUseCase,
  type IssueReceiptUseCase,
} from "@odysseon/whoami-core";
import type { WebCryptoTokenHasher } from "@odysseon/whoami-adapter-webcrypto";
import type {
  InMemoryAccountRepository,
  InMemoryCredentialStore,
} from "../infrastructure/in-memory-repositories.js";

export const createAuthRouter = (
  verifyPassword: VerifyPasswordUseCase,
  verifyMagicLink: VerifyMagicLinkUseCase,
  authenticateOAuth: AuthenticateOAuthUseCase,
  issueReceipt: IssueReceiptUseCase,
  credentialStore: InMemoryCredentialStore,
  accountRepo: InMemoryAccountRepository,
  tokenHasher: WebCryptoTokenHasher,
  generateId: () => number,
): Router => {
  const router = Router();

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

        const accountId = await verifyPassword.execute({
          rawEmail: email,
          plainTextPassword: password,
        });
        const receipt = await issueReceipt.execute(accountId);

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

  router.post(
    "/magic-link/request",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { email } = req.body as { email?: string };
        if (!email) {
          res.status(400).json({ error: "email is required." });
          return;
        }

        const emailVO = new EmailAddress(email);
        const account = await accountRepo.findByEmail(emailVO);
        if (!account) {
          res.json({
            message: "If that email is registered, a magic link has been sent.",
          });
          return;
        }

        const rawToken = crypto.randomUUID();
        const hashedToken = await tokenHasher.hash(rawToken);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        const credentialId = new CredentialId(generateId());
        const credential = Credential.loadExisting(credentialId, account.id, {
          kind: "magic_link",
          token: hashedToken,
          expiresAt,
        });
        await credentialStore.saveWithEmail(credential, account.email);

        res.json({
          magicLinkToken: rawToken,
          expiresAt,
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

  router.post(
    "/magic-link/verify",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { email, token } = req.body as { email?: string; token?: string };
        if (!email || !token) {
          res.status(400).json({ error: "email and token are required." });
          return;
        }

        const hashedToken = await tokenHasher.hash(token);
        const accountId = await verifyMagicLink.execute({
          rawEmail: email,
          token: hashedToken,
          currentTime: new Date(),
        });
        const receipt = await issueReceipt.execute(accountId);

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

        const accountId = await authenticateOAuth.execute({
          rawEmail: email,
          provider,
          providerId,
        });
        const receipt = await issueReceipt.execute(accountId);

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
