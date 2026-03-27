import type { Server } from "node:http";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import express, { type Express, type Request, type Response } from "express";
import {
  Account,
  AccountId,
  type AccountRepository,
  AuthenticationError,
  Credential,
  CredentialId,
  EmailAddress,
  type CredentialStore,
  type LoggerPort,
  type PasswordHasher,
  RegisterAccountUseCase,
  IssueReceiptUseCase,
  type ReceiptSigner,
  VerifyMagicLinkUseCase,
  VerifyPasswordUseCase,
} from "@odysseon/whoami-core";

type StoredAccount = {
  id: AccountId;
  email: EmailAddress;
};

/**
 * In-memory account repository used by the demo application.
 */
class InMemoryAccountRepository implements AccountRepository {
  private readonly accountsById = new Map<string, Account>();

  private readonly accountIdsByEmail = new Map<string, string>();

  public async save(account: Account): Promise<void> {
    const id = String(account.id.value);
    this.accountsById.set(id, account);
    this.accountIdsByEmail.set(account.email.value, id);
  }

  public async findById(id: AccountId): Promise<Account | null> {
    return this.accountsById.get(String(id.value)) ?? null;
  }

  public async findByEmail(email: EmailAddress): Promise<Account | null> {
    const accountId = this.accountIdsByEmail.get(email.value);

    if (!accountId) {
      return null;
    }

    return this.accountsById.get(accountId) ?? null;
  }
}

/**
 * In-memory credential store used by the demo application.
 */
class InMemoryCredentialStore implements CredentialStore {
  private readonly credentialsByEmail = new Map<string, Credential>();

  public async findByEmail(email: EmailAddress): Promise<Credential | null> {
    return this.credentialsByEmail.get(email.value) ?? null;
  }

  public async savePasswordCredential(
    account: StoredAccount,
    plainTextPassword: string,
    hasher: PasswordHasher,
  ): Promise<void> {
    const hash = await hasher.hash(plainTextPassword);

    this.credentialsByEmail.set(
      account.email.value,
      Credential.loadExisting(new CredentialId(randomUUID()), account.id, {
        kind: "password",
        hash,
      }),
    );
  }

  public saveMagicLinkCredential(
    account: StoredAccount,
    token: string,
    expiresAt: Date,
  ): void {
    this.credentialsByEmail.set(
      account.email.value,
      Credential.loadExisting(new CredentialId(randomUUID()), account.id, {
        kind: "magic_link",
        token,
        expiresAt,
      }),
    );
  }
}

/**
 * Demo password hasher for the example application.
 */
class DemoPasswordHasher implements PasswordHasher {
  public async compare(plainText: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plainText}`;
  }

  public async hash(plainText: string): Promise<string> {
    return `hashed:${plainText}`;
  }
}

/**
 * Demo receipt signer for the example application.
 */
class DemoReceiptSigner implements ReceiptSigner {
  public async sign(accountId: AccountId, expiresAt: Date): Promise<string> {
    return `receipt:${accountId.value}:${expiresAt.toISOString()}`;
  }
}

/**
 * Logger implementation backed by the Node console.
 */
class ConsoleLogger implements LoggerPort {
  public info(message: string, ...meta: unknown[]): void {
    console.info(message, ...meta);
  }

  public warn(message: string, ...meta: unknown[]): void {
    console.warn(message, ...meta);
  }

  public error(message: string, trace?: string, ...meta: unknown[]): void {
    console.error(message, trace, ...meta);
  }
}

/**
 * Creates an Express application that exercises the core feature APIs.
 *
 * @returns A configured Express application.
 */
export function createApp(): Express {
  const accountRepository = new InMemoryAccountRepository();
  const credentialStore = new InMemoryCredentialStore();
  const passwordHasher = new DemoPasswordHasher();
  const receiptSigner = new DemoReceiptSigner();
  const logger = new ConsoleLogger();
  const registerAccount = new RegisterAccountUseCase(
    accountRepository,
    randomUUID,
  );
  const verifyPassword = new VerifyPasswordUseCase(
    credentialStore,
    passwordHasher,
    logger,
  );
  const verifyMagicLink = new VerifyMagicLinkUseCase(credentialStore, logger);
  const issueReceipt = new IssueReceiptUseCase(receiptSigner, 60);
  const app = express();

  app.use(express.json());

  app.get("/health", (_request: Request, response: Response) => {
    response.json({ status: "ok" });
  });

  app.post(
    "/accounts/register",
    async (request: Request, response: Response): Promise<void> => {
      const email = String(request.body.email ?? "");
      const password = String(request.body.password ?? "");
      const account = await registerAccount.execute(email);

      if (password) {
        await credentialStore.savePasswordCredential(
          { id: account.id, email: account.email },
          password,
          passwordHasher,
        );
      }

      response.status(201).json({
        accountId: account.id.value,
        email: account.email.value,
      });
    },
  );

  app.post(
    "/magic-links",
    async (request: Request, response: Response): Promise<void> => {
      const email = new EmailAddress(String(request.body.email ?? ""));
      const account = await accountRepository.findByEmail(email);

      if (!account) {
        response.status(404).json({ message: "Account not found." });
        return;
      }

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const token = `magic:${randomUUID()}`;
      credentialStore.saveMagicLinkCredential(
        { id: account.id, email: account.email },
        token,
        expiresAt,
      );

      response.status(201).json({
        accountId: account.id.value,
        token,
        expiresAt: expiresAt.toISOString(),
      });
    },
  );

  app.post(
    "/sessions/password",
    async (request: Request, response: Response): Promise<void> => {
      const accountId = await verifyPassword.execute(
        String(request.body.email ?? ""),
        String(request.body.password ?? ""),
      );
      const receipt = await issueReceipt.execute(accountId);

      response.status(201).json({
        accountId: receipt.accountId.value,
        receipt: receipt.token,
        expiresAt: receipt.expiresAt.toISOString(),
      });
    },
  );

  app.post(
    "/sessions/magic-link",
    async (request: Request, response: Response): Promise<void> => {
      const accountId = await verifyMagicLink.execute(
        String(request.body.email ?? ""),
        String(request.body.token ?? ""),
        new Date(),
      );
      const receipt = await issueReceipt.execute(accountId);

      response.status(201).json({
        accountId: receipt.accountId.value,
        receipt: receipt.token,
        expiresAt: receipt.expiresAt.toISOString(),
      });
    },
  );

  app.use(
    (
      error: unknown,
      _request: Request,
      response: Response,
      _next: express.NextFunction,
    ) => {
      if (error instanceof AuthenticationError) {
        response.status(401).json({ message: error.message });
        return;
      }

      if (error instanceof Error) {
        response.status(400).json({ message: error.message });
        return;
      }

      response.status(500).json({ message: "Unexpected error." });
    },
  );

  return app;
}

/**
 * Starts the example server.
 *
 * @param port - The port to listen on.
 * @returns The started HTTP server.
 */
export function startServer(port: number = 3000): Server {
  const app = createApp();

  return app.listen(port, (): void => {
    console.info(`Example Whoami server listening on port ${port}.`);
  });
}

const isMainModule =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  startServer(Number(process.env.PORT ?? "3000"));
}
