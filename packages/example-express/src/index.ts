import type { Server } from "node:http";
import { pathToFileURL } from "node:url";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";

import {
  // Accounts
  RegisterAccountUseCase,
  type AccountRepository,
  Account,
  // Authentication
  VerifyPasswordUseCase,
  VerifyMagicLinkUseCase,
  AuthenticateOAuthUseCase,
  type CredentialStore,
  Credential,
  // Receipts
  IssueReceiptUseCase,
  VerifyReceiptUseCase,
  // Shared
  AccountId,
  EmailAddress,
  CredentialId,
  DomainError,
  type LoggerPort,
} from "@odysseon/whoami-core";

import {
  JoseReceiptSigner,
  JoseReceiptVerifier,
} from "@odysseon/whoami-adapter-jose";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { WebCryptoTokenHasher } from "@odysseon/whoami-adapter-webcrypto";

// ---------------------------------------------------------------------------
// In-memory infrastructure (dev/demo only)
// ---------------------------------------------------------------------------

class InMemoryAccountRepository implements AccountRepository {
  private readonly store = new Map<string, Account>();

  async save(account: Account): Promise<void> {
    this.store.set(String(account.id.value), account);
  }

  async findById(id: AccountId): Promise<Account | null> {
    return this.store.get(String(id.value)) ?? null;
  }

  async findByEmail(email: EmailAddress): Promise<Account | null> {
    for (const account of this.store.values()) {
      if (account.email.value === email.value) return account;
    }
    return null;
  }
}

class InMemoryCredentialStore implements CredentialStore {
  private readonly store = new Map<string, Credential>();

  async save(credential: Credential): Promise<void> {
    this.store.set(credential.accountId.value.toString(), credential);
  }

  async findByEmail(email: EmailAddress): Promise<Credential | null> {
    for (const credential of this.store.values()) {
      // We index by accountId; resolve via account lookup happens in use-case
      // For simplicity we store a secondary email index here
      const meta = this.emailIndex.get(email.value);
      if (meta && meta === credential.accountId.value.toString()) {
        return credential;
      }
    }
    return null;
  }

  /** Secondary index: email → accountId string */
  readonly emailIndex = new Map<string, string>();

  async saveWithEmail(
    credential: Credential,
    email: EmailAddress,
  ): Promise<void> {
    this.emailIndex.set(email.value, credential.accountId.value.toString());
    await this.save(credential);
  }
}

const consoleLogger: LoggerPort = {
  info: (msg, ...meta): void => console.info("[whoami]", msg, ...meta),
  warn: (msg, ...meta): void => console.warn("[whoami]", msg, ...meta),
  error: (msg, trace, ...meta): void =>
    console.error("[whoami]", msg, trace, ...meta),
};

// ---------------------------------------------------------------------------
// Wire-up
// ---------------------------------------------------------------------------

const JOSE_SECRET =
  process.env.JOSE_SECRET ?? "dev-secret-at-least-32-chars-long!!";

const joseConfig = { secret: JOSE_SECRET, issuer: "whoami-express-example" };
const receiptSigner = new JoseReceiptSigner(joseConfig);
const receiptVerifier = new JoseReceiptVerifier(joseConfig);
const passwordHasher = new Argon2PasswordHasher();
const tokenHasher = new WebCryptoTokenHasher();

const accountRepo = new InMemoryAccountRepository();
const credentialStore = new InMemoryCredentialStore();

let idCounter = 1;
const generateId = (): number => idCounter++;

const registerAccount = new RegisterAccountUseCase(accountRepo, generateId);
const verifyPassword = new VerifyPasswordUseCase(
  credentialStore,
  passwordHasher,
  consoleLogger,
);
const verifyMagicLink = new VerifyMagicLinkUseCase(
  credentialStore,
  consoleLogger,
);
const authenticateOAuth = new AuthenticateOAuthUseCase(
  accountRepo,
  credentialStore,
  generateId,
  consoleLogger,
);
const issueReceipt = new IssueReceiptUseCase(receiptSigner, 60);
const verifyReceipt = new VerifyReceiptUseCase(receiptVerifier);

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------

async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const [type, token] = (req.headers.authorization ?? "").split(" ");
  if (type !== "Bearer" || !token) {
    res.status(401).json({ error: "Bearer token required." });
    return;
  }
  try {
    (req as Request & { identity: unknown }).identity =
      await verifyReceipt.execute(token);
    next();
  } catch (err) {
    if (err instanceof DomainError) {
      res.status(401).json({ error: err.message });
      return;
    }
    next(err);
  }
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export function startServer(port: number = 3000): Server {
  const app = express();
  app.use(express.json());

  // -- POST /register --------------------------------------------------------
  // Body: { email, password }
  app.post(
    "/register",
    async (req: Request, res: Response, next: NextFunction) => {
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

        // Store password credential
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

  // -- POST /login -----------------------------------------------------------
  // Body: { email, password }
  app.post(
    "/login",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, password } = req.body as {
          email?: string;
          password?: string;
        };
        if (!email || !password) {
          res.status(400).json({ error: "email and password are required." });
          return;
        }

        const accountId = await verifyPassword.execute(email, password);
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

  // -- POST /login/magic-link ------------------------------------------------
  // In a real app you would email the token; here we return it directly.
  // Body: { email }
  app.post(
    "/login/magic-link/request",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email } = req.body as { email?: string };
        if (!email) {
          res.status(400).json({ error: "email is required." });
          return;
        }

        // Ensure the account exists
        const emailVO = new EmailAddress(email);
        const account = await accountRepo.findByEmail(emailVO);
        if (!account) {
          // Respond ambiguously to prevent user enumeration
          res.json({
            message: "If that email is registered, a magic link has been sent.",
          });
          return;
        }

        // Generate a raw token, hash it for storage
        const rawToken = crypto.randomUUID();
        const hashedToken = await tokenHasher.hash(rawToken);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

        const credentialId = new CredentialId(generateId());
        const credential = Credential.loadExisting(credentialId, account.id, {
          kind: "magic_link",
          token: hashedToken,
          expiresAt,
        });
        await credentialStore.saveWithEmail(credential, account.email);

        // In production: send rawToken via email. Here we expose it for demo.
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

  // Body: { email, token }
  app.post(
    "/login/magic-link/verify",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, token } = req.body as { email?: string; token?: string };
        if (!email || !token) {
          res.status(400).json({ error: "email and token are required." });
          return;
        }

        // Hash the candidate token before comparing (stored value is hashed)
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

  // -- POST /login/oauth -----------------------------------------------------
  // Body: { email, provider, providerId }
  app.post(
    "/login/oauth",
    async (req: Request, res: Response, next: NextFunction) => {
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

  // -- GET /me ---------------------------------------------------------------
  // Requires Bearer token
  app.get(
    "/me",
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const identity = (
          req as Request & {
            identity: { accountId: AccountId; token: string; expiresAt: Date };
          }
        ).identity;
        const account = await accountRepo.findById(identity.accountId);

        res.json({
          accountId: identity.accountId.value,
          email: account?.email.value ?? null,
          tokenExpiresAt: identity.expiresAt,
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // Global domain-error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof DomainError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  });

  return app.listen(port, (): void => {
    console.info(
      `[whoami] Example Express server listening on http://localhost:${port}`,
    );
    console.info(
      "[whoami] Routes: POST /register  POST /login  POST /login/magic-link/request",
    );
    console.info(
      "[whoami] Routes: POST /login/magic-link/verify  POST /login/oauth  GET /me",
    );
  });
}

const isMainModule =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  startServer(Number(process.env.PORT ?? "3000"));
}
