import type { AccountRepository } from "../kernel/account/account.repository.port.js";
import type { ReceiptSigner } from "../kernel/receipt/ports/receipt-signer.port.js";
import type { ReceiptVerifier } from "../kernel/receipt/ports/receipt-verifier.port.js";
import type { LoggerPort } from "../kernel/shared/ports/logger.port.js";
import type { IdGeneratorPort } from "../kernel/shared/ports/id-generator.port.js";
import type { ClockPort } from "../kernel/shared/ports/clock.port.js";
import { IssueReceiptUseCase } from "../kernel/receipt/usecases/issue-receipt.usecase.js";
import { VerifyReceiptUseCase } from "../kernel/receipt/usecases/verify-receipt.usecase.js";

/**
 * Shared infrastructure passed to every module's `create` call.
 * @public
 */
export interface CoreContext {
  accountRepo: AccountRepository;
  issueReceipt: Pick<IssueReceiptUseCase, "execute">;
  verifyReceipt: Pick<VerifyReceiptUseCase, "execute">;
  logger: LoggerPort;
  idGenerator: IdGeneratorPort;
}

export interface CoreInfrastructure {
  accountRepo: AccountRepository;
  receiptSigner: ReceiptSigner;
  receiptVerifier: ReceiptVerifier;
  logger: LoggerPort;
  idGenerator: IdGeneratorPort;
  clock?: ClockPort;
  tokenLifespanMinutes?: number;
}

export function buildCoreContext(infra: CoreInfrastructure): CoreContext {
  const issueReceipt = new IssueReceiptUseCase({
    signer: infra.receiptSigner,
    ...(infra.clock !== undefined ? { clock: infra.clock } : {}),
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
    idGenerator: infra.idGenerator,
  };
}
