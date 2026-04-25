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
import type { PasswordCredentialStore } from "./ports/password-credential-store.port.js";
import type { PasswordHasher } from "./ports/password-hasher.port.js";
import { isPasswordResetProof } from "./entities/password.proof.js";
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
} from "./use-cases/index.js";

/**
 * Configuration for the password module
 */
export interface PasswordModuleConfig {
  readonly accountRepo: AccountRepository;
  readonly passwordStore: PasswordCredentialStore;
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
  // Standard password operations
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

  // Password recovery operations (INSIDE password module)
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

/**
 * Deserializer for password proofs
 */
class PasswordProofDeserializer implements CredentialProofDeserializer {
  readonly kind = "password";

  deserialize(data: unknown): CredentialProof {
    assertObject(data);

    if (data.kind === "password_hash") {
      if (typeof data.hash !== "string") {
        throw new Error("Password hash proof must have a hash string");
      }
      return credentialProof({
        kind: "password_hash",
        hash: data.hash,
      });
    }

    if (data.kind === "password_reset") {
      if (typeof data.tokenHash !== "string") {
        throw new Error("Password reset proof must have a tokenHash string");
      }
      if (
        !(data.expiresAt instanceof Date) &&
        typeof data.expiresAt !== "string"
      ) {
        throw new Error("Password reset proof must have an expiresAt date");
      }
      return credentialProof({
        kind: "password_reset",
        tokenHash: data.tokenHash,
        expiresAt:
          data.expiresAt instanceof Date
            ? data.expiresAt
            : new Date(data.expiresAt),
        usedAt:
          data.usedAt instanceof Date
            ? data.usedAt
            : typeof data.usedAt === "string"
              ? new Date(data.usedAt)
              : undefined,
      });
    }

    throw new Error(`Unknown password proof kind: ${String(data.kind)}`);
  }
}

/**
 * Creates the password authentication module.
 * Includes standard password operations AND recovery (no orphan module!)
 */
export function PasswordModule(
  config: PasswordModuleConfig,
): PasswordMethods & AuthModule {
  const tokenLifespanMinutes = config.tokenLifespanMinutes ?? 60;
  const resetTokenLifespanMinutes = config.resetTokenLifespanMinutes ?? 15;

  // Create use cases
  const registerUseCase = new RegisterWithPasswordUseCase({
    accountRepo: config.accountRepo,
    passwordStore: config.passwordStore,
    passwordHasher: config.passwordHasher,
    idGenerator: config.idGenerator,
    logger: config.logger,
  });

  const authenticateUseCase = new AuthenticateWithPasswordUseCase({
    accountRepo: config.accountRepo,
    passwordStore: config.passwordStore,
    passwordHasher: config.passwordHasher,
    receiptSigner: config.receiptSigner,
    logger: config.logger,
    tokenLifespanMinutes,
  });

  const changePasswordUseCase = new ChangePasswordUseCase({
    accountRepo: config.accountRepo,
    passwordStore: config.passwordStore,
    passwordHasher: config.passwordHasher,
    logger: config.logger,
  });

  const addPasswordUseCase = new AddPasswordToAccountUseCase({
    accountRepo: config.accountRepo,
    passwordStore: config.passwordStore,
    passwordHasher: config.passwordHasher,
    idGenerator: config.idGenerator,
    logger: config.logger,
  });

  // Recovery use cases (INSIDE password module)
  const requestResetUseCase = new RequestPasswordResetUseCase({
    accountRepo: config.accountRepo,
    passwordStore: config.passwordStore,
    idGenerator: config.idGenerator,
    logger: config.logger,
    clock: config.clock,
    secureToken: config.secureToken,
    config: { tokenLifespanMinutes: resetTokenLifespanMinutes },
  });

  const verifyResetUseCase = new VerifyPasswordResetUseCase({
    passwordStore: config.passwordStore,
    receiptSigner: config.receiptSigner,
    secureToken: config.secureToken,
    config: { receiptLifespanMinutes: 10 },
  });

  const revokeAllResetsUseCase = new RevokeAllPasswordResetsUseCase({
    passwordStore: config.passwordStore,
  });

  return {
    kind: "password",
    proofDeserializer: new PasswordProofDeserializer(),

    // Standard password operations
    registerWithPassword: async (
      input,
    ): Promise<{
      account: { id: string; email: string; createdAt: Date };
    }> => {
      const result = await registerUseCase.execute(input);
      return {
        account: {
          id: result.account.id.toString(),
          email: result.account.email.toString(),
          createdAt: result.account.createdAt,
        },
      };
    },

    authenticateWithPassword: async (
      input,
    ): Promise<{
      receipt: { token: string; accountId: string; expiresAt: Date };
      account: { id: string; email: string; createdAt: Date };
    }> => {
      const result = await authenticateUseCase.execute(input);
      return {
        receipt: {
          token: result.receipt.token,
          accountId: result.receipt.accountId.toString(),
          expiresAt: result.receipt.expiresAt,
        },
        account: {
          id: result.account.id.toString(),
          email: result.account.email.toString(),
          createdAt: result.account.createdAt,
        },
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

    // Recovery methods (INSIDE password module)
    requestPasswordReset: (input) => requestResetUseCase.execute(input),
    verifyPasswordReset: (input) => verifyResetUseCase.execute(input),
    revokeAllPasswordResets: (input) =>
      revokeAllResetsUseCase.execute({
        accountId: createAccountId(input.accountId),
      }),

    // AuthModule lifecycle interface
    async countCredentialsForAccount(accountId: string): Promise<number> {
      return await config.passwordStore.countForAccount(
        createAccountId(accountId),
      );
    },

    async removeCredential(credentialId: CredentialId): Promise<void> {
      await config.passwordStore.delete(credentialId);
    },

    async removeAllCredentialsForAccount(
      accountId: string,
      _options?: { provider?: string },
    ): Promise<void> {
      const credential = await config.passwordStore.findByAccountId(
        createAccountId(accountId),
      );
      if (credential && !isPasswordResetProof(credential.proof)) {
        await config.passwordStore.delete(credential.id);
      }
    },
  };
}
