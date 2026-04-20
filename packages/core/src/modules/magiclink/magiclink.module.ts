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
} from "../../kernel/ports/shared-ports.port.js";
import type { MagicLinkCredentialStore } from "./ports/magiclink-credential-store.port.js";
import {
  RequestMagicLinkUseCase,
  AuthenticateWithMagicLinkUseCase,
  type RequestMagicLinkOutput,
} from "./use-cases/index.js";

/**
 * Configuration for the MagicLink module
 */
export interface MagicLinkModuleConfig {
  readonly accountRepo: AccountRepository;
  readonly magicLinkStore: MagicLinkCredentialStore;
  readonly receiptSigner: ReceiptSigner;
  readonly idGenerator: IdGeneratorPort;
  readonly logger: LoggerPort;
  readonly clock: ClockPort;
  readonly tokenLifespanMinutes?: number;
  readonly receiptLifespanMinutes?: number;
}

/**
 * Methods exposed by the MagicLink module
 */
export interface MagicLinkMethods {
  readonly requestMagicLink: (input: {
    email: string;
  }) => Promise<RequestMagicLinkOutput>;

  readonly authenticateWithMagicLink: (input: { token: string }) => Promise<{
    receipt: { token: string; accountId: string; expiresAt: Date };
    accountId: string;
    email: string;
  }>;
}

/**
 * Deserializer for MagicLink proofs
 */
class MagicLinkProofDeserializer implements CredentialProofDeserializer {
  readonly kind = "magiclink";

  deserialize(data: unknown): CredentialProof {
    if (data === null || typeof data !== "object") {
      throw new Error("MagicLink proof must be an object");
    }

    const proof = data as Record<string, unknown>;

    if (proof.kind !== "magiclink") {
      throw new Error(`Expected kind 'magiclink' but got '${proof.kind}'`);
    }

    if (typeof proof.tokenHash !== "string") {
      throw new Error("MagicLink proof must have a tokenHash string");
    }

    if (typeof proof.email !== "string") {
      throw new Error("MagicLink proof must have an email string");
    }

    if (
      !(proof.expiresAt instanceof Date) &&
      typeof proof.expiresAt !== "string"
    ) {
      throw new Error("MagicLink proof must have an expiresAt date");
    }

    return {
      kind: "magiclink",
      tokenHash: proof.tokenHash,
      email: proof.email,
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
}

/**
 * Creates the MagicLink authentication module.
 *
 * EXTENSIBILITY PROOF: This module was added WITHOUT any changes to kernel files.
 * It implements the AuthModule interface and registers via the modules array.
 *
 * Zero kernel changes required for new auth methods.
 */
export function MagicLinkModule(
  config: MagicLinkModuleConfig,
): AuthModule<MagicLinkMethods> {
  const tokenLifespanMinutes = config.tokenLifespanMinutes ?? 15;
  const receiptLifespanMinutes = config.receiptLifespanMinutes ?? 60;

  // Create use cases
  const requestUseCase = new RequestMagicLinkUseCase({
    accountRepo: config.accountRepo,
    magicLinkStore: config.magicLinkStore,
    idGenerator: config.idGenerator,
    logger: config.logger,
    clock: config.clock,
    config: { tokenLifespanMinutes },
  });

  const authenticateUseCase = new AuthenticateWithMagicLinkUseCase({
    magicLinkStore: config.magicLinkStore,
    receiptSigner: config.receiptSigner,
    config: { receiptLifespanMinutes },
  });

  // Create methods object
  const methods: MagicLinkMethods = {
    requestMagicLink: (input) => requestUseCase.execute(input),

    authenticateWithMagicLink: async (input) => {
      const result = await authenticateUseCase.execute(input);
      return {
        receipt: {
          token: result.receipt.token,
          accountId: result.receipt.accountId.toString(),
          expiresAt: result.receipt.expiresAt,
        },
        accountId: result.accountId.toString(),
        email: result.email,
      };
    },
  };

  return {
    kind: "magiclink",
    proofDeserializer: new MagicLinkProofDeserializer(),
    methods,

    // Implement AuthModule interface
    async countCredentialsForAccount(accountId: string): Promise<number> {
      return await config.magicLinkStore.countForAccount(
        accountId as unknown as AccountId,
      );
    },

    async removeCredential(credentialId: CredentialId): Promise<void> {
      await config.magicLinkStore.delete(credentialId);
    },

    async removeAllCredentialsForAccount(accountId: string): Promise<void> {
      await config.magicLinkStore.deleteAllForAccount(
        accountId as unknown as AccountId,
      );
    },
  };
}
