import {
  RequestMagicLinkUseCase,
  AuthenticateWithMagicLinkUseCase,
} from "./use-cases/index.js";
import type { MagicLinkModuleConfig } from "./magiclink.config.js";

export interface MagicLinkUseCases {
  readonly request: RequestMagicLinkUseCase;
  readonly authenticate: AuthenticateWithMagicLinkUseCase;
}

export function buildMagicLinkUseCases(
  config: MagicLinkModuleConfig,
  tokenLifespanMinutes: number,
  receiptLifespanMinutes: number,
): MagicLinkUseCases {
  const sharedConfig = {
    tokenLifespanMinutes,
    receiptLifespanMinutes,
  };

  return {
    request: new RequestMagicLinkUseCase({
      accountRepo: config.accountRepo,
      magicLinkStore: config.magicLinkStore,
      idGenerator: config.idGenerator,
      logger: config.logger,
      clock: config.clock,
      secureToken: config.secureToken,
      config: sharedConfig,
    }),

    authenticate: new AuthenticateWithMagicLinkUseCase({
      magicLinkStore: config.magicLinkStore,
      receiptSigner: config.receiptSigner,
      secureToken: config.secureToken,
      config: sharedConfig,
    }),
  };
}
