import type { AccountRepository } from "../features/accounts/index.js";
import type {
  ReceiptSigner,
  ReceiptVerifier,
} from "../features/receipts/index.js";
import type { LoggerPort } from "../shared/index.js";
import { IssueReceiptUseCase } from "../features/receipts/application/issue-receipt.usecase.js";
import { VerifyReceiptUseCase } from "../features/receipts/application/verify-receipt.usecase.js";

/**
 * Shared infrastructure that every auth module may consume.
 *
 * Built once inside {@link createAuth} and passed to every registered module's
 * `create` call. Modules should only destructure the fields they actually need.
 *
 * @public
 */
export interface CoreContext {
  /** Persistence port for account aggregates. */
  accountRepo: AccountRepository;
  /** Issues signed receipts on successful authentication. */
  issueReceipt: IssueReceiptUseCase;
  /** Verifies previously issued receipt tokens. */
  verifyReceipt: VerifyReceiptUseCase;
  /** Structured logger. */
  logger: LoggerPort;
  /**
   * Deterministic ID generator.
   * Inject `crypto.randomUUID` or any UUID v4 factory.
   */
  generateId: () => string;
}

/**
 * Raw signer/verifier config needed to build {@link CoreContext} receipt use-cases.
 * @internal
 */
export interface CoreInfrastructure {
  accountRepo: AccountRepository;
  receiptSigner: ReceiptSigner;
  receiptVerifier: ReceiptVerifier;
  logger: LoggerPort;
  generateId: () => string;
  tokenLifespanMinutes?: number;
}

/**
 * Builds a {@link CoreContext} from raw infrastructure config.
 * @internal
 */
export function buildCoreContext(infra: CoreInfrastructure): CoreContext {
  const issueReceipt = new IssueReceiptUseCase({
    signer: infra.receiptSigner,
    ...(infra.tokenLifespanMinutes !== undefined
      ? { tokenLifespanMinutes: infra.tokenLifespanMinutes }
      : {}),
  });

  const verifyReceipt = new VerifyReceiptUseCase(infra.receiptVerifier);

  return {
    accountRepo: infra.accountRepo,
    issueReceipt,
    verifyReceipt,
    logger: infra.logger,
    generateId: infra.generateId,
  };
}
