import type {
  AuthModule,
  CredentialProofDeserializer,
} from "../../kernel/ports/auth-module.port.js";
import type { CredentialProof } from "../../kernel/domain/entities/credential.js";
import {
  type CredentialId,
  createAccountId,
} from "../../kernel/domain/value-objects/index.js";
import type { AccountRepository } from "../../kernel/ports/account-repository.port.js";
import type { ReceiptSigner } from "../../kernel/ports/receipt-signer.port.js";
import type {
  IdGeneratorPort,
  LoggerPort,
  ClockPort,
  SecureTokenPort,
} from "../../kernel/ports/shared-ports.port.js";
import type { PasswordHashStore } from "./ports/password-hash-store.port.js";
import type { PasswordResetTokenStore } from "./ports/password-reset-token-store.port.js";
import type { PasswordHasher } from "./ports/password-hasher.port.js";
import {
  RegisterWithPasswordUseCase,
  AuthenticateWithPasswordUseCase,
  ChangePasswordUseCase,
  AddPasswordToAccountUseCase,
  RequestPasswordResetUseCase,
  VerifyPasswordResetUseCase,
  RevokeAllPasswordResetsUseCase,
  type RequestPasswordResetOutput,
  type VerifyPasswordResetOutput,
  type RegisterWithPasswordOutput,
  type AuthenticateWithPasswordOutput,
} from "./use-cases/index.js";

/**
 * Configuration for the password module.
 *
 * Two stores are required because they have fundamentally different invariants:
 * - passwordHashStore: unique per account, permanent until changed
 * - resetTokenStore: many per account, short-lived, expirable
 */
export interface PasswordModuleConfig {
  readonly accountRepo: AccountRepository;
  readonly passwordHashStore: PasswordHashStore;
  readonly resetTokenStore: PasswordResetTokenStore;
  readonly passwordHasher: PasswordHasher;
  readonly receiptSigner: ReceiptSigner;
  readonly idGenerator: IdGeneratorPort;
  readonly logger: LoggerPort;
  readonly clock: ClockPort;
  readonly secureToken: SecureTokenPort;
  readonly tokenLifespanMinutes?: number;
  readonly resetTokenLifespanMinutes?: number;
}

/**
 * Methods exposed by the password module
 */
export interface PasswordMethods {
  readonly registerWithPassword: (input: {
    email: string;
    password: string;
  }) => Promise<{ account: { id: string; email: string; createdAt: Date } }>;

  readonly authenticateWithPassword: (input: {
    email: string;
    password: string;
  }) => Promise<{
    receipt: { token: string; accountId: string; expiresAt: Date };
    account: { id: string; email: string; createdAt: Date };
  }>;

  readonly changePassword: (input: {
    accountId: string;
    currentPassword: string;
    newPassword: string;
  }) => Promise<{ success: true }>;

  readonly addPasswordToAccount: (input: {
    accountId: string;
    password: string;
  }) => Promise<{ success: true }>;

  readonly requestPasswordReset: (input: {
    email: string;
  }) => Promise<RequestPasswordResetOutput | null>;

  readonly verifyPasswordReset: (input: {
    token: string;
  }) => Promise<VerifyPasswordResetOutput>;

  readonly revokeAllPasswordResets: (input: {
    accountId: string;
  }) => Promise<{ success: true }>;
}

function assertObject(data: unknown): asserts data is Record<string, unknown> {
  if (data === null || typeof data !== "object") {
    throw new Error("Password proof must be an object");
  }
}

function credentialProof<T extends CredentialProof>(proof: T): CredentialProof {
  return proof;
}

class PasswordProofDeserializer implements CredentialProofDeserializer {
  readonly kind = "password";

  deserialize(data: unknown): CredentialProof {
    assertObject(data);

    if (data["kind"] === "password_hash") {
      if (typeof data["hash"] !== "string") {
        throw new Error("Password hash proof must have a hash string");
      }
      return credentialProof({ kind: "password_hash", hash: data["hash"] });
    }

    if (data["kind"] === "password_reset") {
      if (typeof data["tokenHash"] !== "string") {
        throw new Error("Password reset proof must have a tokenHash string");
      }
      if (
        !(data["expiresAt"] instanceof Date) &&
        typeof data["expiresAt"] !== "string"
      ) {
        throw new Error("Password reset proof must have an expiresAt date");
      }
      return credentialProof({
        kind: "password_reset",
        tokenHash: data["tokenHash"],
        expiresAt:
          data["expiresAt"] instanceof Date
            ? data["expiresAt"]
            : new Date(data["expiresAt"]),
        usedAt:
          data["usedAt"] instanceof Date
            ? data["usedAt"]
            : typeof data["usedAt"] === "string"
              ? new Date(data["usedAt"])
              : undefined,
      });
    }

    throw new Error(`Unknown password proof kind: ${String(data["kind"])}`);
  }
}

/**
 * Creates the password authentication module.
 */
export function PasswordModule(
  config: PasswordModuleConfig,
): PasswordMethods & AuthModule {
  const tokenLifespanMinutes = config.tokenLifespanMinutes ?? 60;
  const resetTokenLifespanMinutes = config.resetTokenLifespanMinutes ?? 15;

  const registerUseCase = new RegisterWithPasswordUseCase({
    accountRepo: config.accountRepo,
    passwordStore: config.passwordHashStore,
    passwordHasher: config.passwordHasher,
    idGenerator: config.idGenerator,
    logger: config.logger,
  });

  const authenticateUseCase = new AuthenticateWithPasswordUseCase({
    accountRepo: config.accountRepo,
    passwordStore: config.passwordHashStore,
    passwordHasher: config.passwordHasher,
    receiptSigner: config.receiptSigner,
    logger: config.logger,
    tokenLifespanMinutes,
  });

  const changePasswordUseCase = new ChangePasswordUseCase({
    accountRepo: config.accountRepo,
    passwordStore: config.passwordHashStore,
    passwordHasher: config.passwordHasher,
    logger: config.logger,
  });

  const addPasswordUseCase = new AddPasswordToAccountUseCase({
    accountRepo: config.accountRepo,
    passwordStore: config.passwordHashStore,
    passwordHasher: config.passwordHasher,
    idGenerator: config.idGenerator,
    logger: config.logger,
  });

  const requestResetUseCase = new RequestPasswordResetUseCase({
    accountRepo: config.accountRepo,
    resetTokenStore: config.resetTokenStore,
    idGenerator: config.idGenerator,
    logger: config.logger,
    clock: config.clock,
    secureToken: config.secureToken,
    config: { tokenLifespanMinutes: resetTokenLifespanMinutes },
  });

  const verifyResetUseCase = new VerifyPasswordResetUseCase({
    resetTokenStore: config.resetTokenStore,
    receiptSigner: config.receiptSigner,
    secureToken: config.secureToken,
    config: { receiptLifespanMinutes: 10 },
  });

  const revokeAllResetsUseCase = new RevokeAllPasswordResetsUseCase({
    resetTokenStore: config.resetTokenStore,
  });

  return {
    kind: "password",
    proofDeserializer: new PasswordProofDeserializer(),

    registerWithPassword: async (
      input,
    ): Promise<RegisterWithPasswordOutput> => {
      const result = await registerUseCase.execute(input);
      return {
        account: result.account,
      };
    },

    authenticateWithPassword: async (
      input,
    ): Promise<AuthenticateWithPasswordOutput> => {
      const result = await authenticateUseCase.execute(input);
      return {
        receipt: result.receipt,
        account: result.account,
      };
    },

    changePassword: (input) =>
      changePasswordUseCase.execute({
        accountId: createAccountId(input.accountId),
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      }),

    addPasswordToAccount: (input) =>
      addPasswordUseCase.execute({
        accountId: createAccountId(input.accountId),
        password: input.password,
      }),

    requestPasswordReset: (input) => requestResetUseCase.execute(input),
    verifyPasswordReset: (input) => verifyResetUseCase.execute(input),
    revokeAllPasswordResets: (input) =>
      revokeAllResetsUseCase.execute({
        accountId: createAccountId(input.accountId),
      }),

    // AuthModule lifecycle — only counts/removes hash credentials
    async countCredentialsForAccount(accountId: string): Promise<number> {
      return await config.passwordHashStore.countForAccount(
        createAccountId(accountId),
      );
    },

    async removeCredential(credentialId: CredentialId): Promise<void> {
      await config.passwordHashStore.delete(credentialId);
    },

    async removeAllCredentialsForAccount(
      accountId: string,
      _options?: { provider?: string },
    ): Promise<void> {
      const credential = await config.passwordHashStore.findByAccountId(
        createAccountId(accountId),
      );
      if (credential) {
        await config.passwordHashStore.delete(credential.id);
      }
    },
  };
}
