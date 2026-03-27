import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { WhoamiModule } from "./whoami.module.js";
import { WhoamiService } from "@odysseon/whoami-core";
import type { Provider } from "@nestjs/common";
import type { WhoamiModuleOptions } from "./whoami.module.js";

function createModuleOptions(): WhoamiModuleOptions {
  return {
    tokenSigner: {
      sign: async (): Promise<string> => "token",
      verify: async (): Promise<{ sub: string }> => ({ sub: "123" }),
    },
  };
}

describe("WhoamiModule", () => {
  it("should return a valid dynamic module structure", () => {
    const dynamicModule = WhoamiModule.registerAsync({
      useFactory: createModuleOptions,
    });

    assert.equal(dynamicModule.module, WhoamiModule);
    assert.ok(dynamicModule.providers?.length);
    assert.ok(dynamicModule.controllers?.length);
    assert.ok(dynamicModule.exports?.length);
  });

  it("should successfully execute the factory and instantiate the pure core service", async () => {
    const dynamicModule = WhoamiModule.registerAsync({
      useFactory: createModuleOptions,
    });

    const serviceProvider = dynamicModule.providers?.find(
      (p: unknown) =>
        (p as Provider & { provide: unknown }).provide === WhoamiService,
    ) as Provider & { useFactory: (opts: unknown) => unknown };

    assert.ok(serviceProvider);
    assert.ok(typeof serviceProvider.useFactory === "function");

    const mockOptions = createModuleOptions();

    const serviceInstance = serviceProvider.useFactory(mockOptions);
    assert.ok(serviceInstance instanceof WhoamiService);
  });
});
