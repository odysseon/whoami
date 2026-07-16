import {
  RequestMagicLinkUseCase,
  AuthenticateWithMagicLinkUseCase,
} from "./use-cases/index.js";
import type { MagicLinkModuleConfig } from "./magiclink.config.js";
import { IssueReceiptUseCase } from "../../kernel/shared/issue-receipt.use-case.js";

export interface MagicLinkUseCases {
  readonly request: RequestMagicLinkUseCase;
  readonly authenticate: AuthenticateWithMagicLinkUseCase;
}

export function buildMagicLinkUseCases(
  config: MagicLinkModuleConfig,
  tokenLifespanMinutes: number,
  receiptLifespanMinutes: number,
): MagicLinkUseCases {
  const issueReceipt = new IssueReceiptUseCase({
    receiptSigner: config.receiptSigner,
    tokenLifespanMinutes: receiptLifespanMinutes,
  });

  return {
    request: new RequestMagicLinkUseCase({
      accountRepo: config.accountRepo,
      magicLinkStore: config.magicLinkStore,
      idGenerator: config.idGenerator,
      logger: config.logger,
      clock: config.clock,
      secureToken: config.secureToken,
      config: { tokenLifespanMinutes },
    }),

    authenticate: new AuthenticateWithMagicLinkUseCase({
      magicLinkStore: config.magicLinkStore,
      secureToken: config.secureToken,
      issueReceipt,
    }),
  };
}
