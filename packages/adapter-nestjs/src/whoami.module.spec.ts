import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Receipt, VerifyReceiptUseCase } from "@odysseon/whoami-core";
import type { Provider } from "@nestjs/common";
import { WhoamiModule, type WhoamiModuleOptions } from "./whoami.module.js";

function createModuleOptions(): WhoamiModuleOptions {
  return {
    receiptVerifier: {
      verify: async (token): Promise<Receipt> => {
        throw new Error(`unexpected token: ${token}`);
      },
    },
  };
}

describe("WhoamiModule", () => {
  it("returns a valid dynamic module structure", () => {
    const dynamicModule = WhoamiModule.registerAsync({
      useFactory: createModuleOptions,
    });

    assert.equal(dynamicModule.module, WhoamiModule);
    assert.ok(dynamicModule.providers?.length);
    assert.ok(dynamicModule.exports?.length);
  });

  it("instantiates VerifyReceiptUseCase from module options", () => {
    const dynamicModule = WhoamiModule.registerAsync({
      useFactory: createModuleOptions,
    });
    const provider = dynamicModule.providers?.find(
      (candidate: unknown) =>
        (candidate as Provider & { provide: unknown }).provide ===
        VerifyReceiptUseCase,
    ) as Provider & {
      useFactory: (options: WhoamiModuleOptions) => VerifyReceiptUseCase;
    };

    assert.ok(provider);

    const useCase = provider.useFactory(createModuleOptions());
    assert.ok(useCase instanceof VerifyReceiptUseCase);
  });
});
