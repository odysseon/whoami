import type {
  AuthModule,
  CredentialProofDeserializer,
} from "../../kernel/ports/auth-module.port.js";
import type { CredentialProof } from "../../kernel/domain/entities/credential.js";
import type {
  CredentialId,
  AccountId,
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

/**
 * Deserializer for password proofs
 */
class PasswordProofDeserializer implements CredentialProofDeserializer {
  readonly kind = "password";

  deserialize(data: unknown): CredentialProof {
    if (data === null || typeof data !== "object") {
      throw new Error("Password proof must be an object");
    }

    const proof = data as Record<string, unknown>;

    if (proof.kind === "password_hash") {
      if (typeof proof.hash !== "string") {
        throw new Error("Password hash proof must have a hash string");
      }
      return {
        kind: "password_hash",
        hash: proof.hash,
      } as CredentialProof;
    }

    if (proof.kind === "password_reset") {
      if (typeof proof.tokenHash !== "string") {
        throw new Error("Password reset proof must have a tokenHash string");
      }
      if (
        !(proof.expiresAt instanceof Date) &&
        typeof proof.expiresAt !== "string"
      ) {
        throw new Error("Password reset proof must have an expiresAt date");
      }
      return {
        kind: "password_reset",
        tokenHash: proof.tokenHash,
        expiresAt:
          proof.expiresAt instanceof Date
            ? proof.expiresAt
            : new Date(proof.expiresAt),
        usedAt:
          proof.usedAt instanceof Date
            ? proof.usedAt
            : typeof proof.usedAt === "string"
              ? new Date(proof.usedAt)
              : undefined,
      } as CredentialProof;
    }

    throw new Error(`Unknown password proof kind: ${proof.kind}`);
  }
}

/**
 * Creates the password authentication module.
 * Includes standard password operations AND recovery (no orphan module!)
 */
export function PasswordModule(
  config: PasswordModuleConfig,
): AuthModule<PasswordMethods> {
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

  // Create methods object with bound functions
  const methods: PasswordMethods = {
    registerWithPassword: async (input) => {
      const result = await registerUseCase.execute(input);
      return {
        account: {
          id: result.account.id.toString(),
          email: result.account.email.toString(),
          createdAt: result.account.createdAt,
        },
      };
    },

    authenticateWithPassword: async (input) => {
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
        accountId: input.accountId as unknown as AccountId,
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      }),

    addPasswordToAccount: (input) =>
      addPasswordUseCase.execute({
        accountId: input.accountId as unknown as AccountId,
        password: input.password,
      }),

    // Recovery methods (INSIDE password module)
    requestPasswordReset: (input) => requestResetUseCase.execute(input),
    verifyPasswordReset: (input) => verifyResetUseCase.execute(input),
    revokeAllPasswordResets: (input) =>
      revokeAllResetsUseCase.execute({
        accountId: input.accountId as unknown as AccountId,
      }),
  };

  return {
    kind: "password",
    proofDeserializer: new PasswordProofDeserializer(),
    methods,

    // Implement AuthModule interface
    async countCredentialsForAccount(accountId: string): Promise<number> {
      return await config.passwordStore.countForAccount(
        accountId as unknown as AccountId,
      );
    },

    async removeCredential(credentialId: CredentialId): Promise<void> {
      await config.passwordStore.delete(credentialId);
    },

    async removeAllCredentialsForAccount(accountId: string): Promise<void> {
      const credential = await config.passwordStore.findByAccountId(
        accountId as unknown as AccountId,
      );
      if (credential && !isPasswordResetProof(credential.proof)) {
        await config.passwordStore.delete(credential.id);
      }
    },
  };
}
