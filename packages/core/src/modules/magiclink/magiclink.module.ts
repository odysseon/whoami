import type { AuthModule } from "../../kernel/ports/auth-module.port.js";
import { requirePort, requireMethod } from "../../kernel/shared/validation.js";
import { buildAuthLifecycle } from "../../kernel/shared/auth-lifecycle.js";
import type {
  MagicLinkModuleConfig,
  MagicLinkMethods,
} from "./magiclink.config.js";
import { MagicLinkProofDeserializer } from "./magiclink.deserializer.js";
import { buildMagicLinkUseCases } from "./magiclink.factory.js";

export type { MagicLinkModuleConfig, MagicLinkMethods };

function validateConfig(config: MagicLinkModuleConfig): void {
  requireMethod(config.accountRepo, "findByEmail", "accountRepo");
  requireMethod(config.magicLinkStore, "findByTokenHash", "magicLinkStore");
  requireMethod(config.receiptSigner, "sign", "receiptSigner");
  requirePort(config.idGenerator, "idGenerator");
  requirePort(config.logger, "logger");
  requirePort(config.clock, "clock");
  requireMethod(config.secureToken, "hashToken", "secureToken");
}

/** Creates the MagicLink authentication module. */
export function MagicLinkModule(
  config: MagicLinkModuleConfig,
): MagicLinkMethods & AuthModule {
  validateConfig(config);

  const tokenLifespanMinutes = config.tokenLifespanMinutes ?? 15;
  const receiptLifespanMinutes = config.receiptLifespanMinutes ?? 60;

  const uc = buildMagicLinkUseCases(
    config,
    tokenLifespanMinutes,
    receiptLifespanMinutes,
  );

  const lifecycle = buildAuthLifecycle(config.magicLinkStore);

  return {
    kind: "magiclink",
    proofDeserializer: new MagicLinkProofDeserializer(),

    requestMagicLink: (input) => uc.request.execute(input),

    authenticateWithMagicLink: async (
      input,
    ): Promise<{
      receipt: { token: string; accountId: string; expiresAt: Date };
      accountId: string;
      email: string;
    }> => {
      const result = await uc.authenticate.execute(input);
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

    ...lifecycle,
  };
}
