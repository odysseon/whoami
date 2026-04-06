import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Test } from "@nestjs/testing";
import {
  VerifyReceiptUseCase,
  type ReceiptVerifier,
} from "@odysseon/whoami-core";
import { WhoamiModule } from "./whoami.module.js";

const fakeVerifier: ReceiptVerifier = {
  verify: async () => {
    throw new Error("not used");
  },
};

describe("WhoamiModule", () => {
  it("returns a valid dynamic module structure", () => {
    const mod = WhoamiModule.register({ verifier: fakeVerifier });
    assert.equal(mod.module, WhoamiModule);
    assert.ok(Array.isArray(mod.providers));
    assert.ok(Array.isArray(mod.exports));
  });

  it("instantiates VerifyReceiptUseCase from module options", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [WhoamiModule.register({ verifier: fakeVerifier })],
    }).compile();

    const useCase = moduleRef.get(VerifyReceiptUseCase);
    assert.ok(useCase instanceof VerifyReceiptUseCase);
  });
});
