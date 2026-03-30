import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  AuthenticateOAuthUseCase,
  IssueReceiptUseCase,
  OAuthCallbackHandler,
} from "@odysseon/whoami-core";
import type { Provider } from "@nestjs/common";
import {
  WhoamiOAuthModule,
  type WhoamiOAuthModuleOptions,
} from "./whoami-oauth.module.js";

function makeOptions(): WhoamiOAuthModuleOptions {
  return {
    accountRepository: {
      save: async (): Promise<void> => {},
      findById: async (): Promise<null> => null,
      findByEmail: async (): Promise<null> => null,
    },
    credentialStore: {
      save: async (): Promise<void> => {},
      findByEmail: async (): Promise<null> => null,
      deleteByEmail: async (): Promise<void> => {},
    },
    receiptSigner: { sign: async (): Promise<string> => "token" },
    generateId: (): string => "acc_1",
    tokenLifespanMinutes: 60,
  };
}

function findProvider<T>(
  providers: Provider[],
  token: unknown,
): (Provider & { useFactory: (...args: unknown[]) => T }) | undefined {
  return providers.find(
    (p) => (p as Provider & { provide: unknown }).provide === token,
  ) as Provider & { useFactory: (...args: unknown[]) => T };
}

describe("WhoamiOAuthModule", () => {
  it("returns a valid dynamic module structure", () => {
    const mod = WhoamiOAuthModule.registerAsync({ useFactory: makeOptions });
    assert.equal(mod.module, WhoamiOAuthModule);
    assert.ok(Array.isArray(mod.providers) && mod.providers.length > 0);
    assert.ok(Array.isArray(mod.exports) && mod.exports.length > 0);
  });

  it("exports OAuthCallbackHandler, AuthenticateOAuthUseCase, IssueReceiptUseCase", () => {
    const mod = WhoamiOAuthModule.registerAsync({ useFactory: makeOptions });
    assert.ok(mod.exports?.includes(OAuthCallbackHandler));
    assert.ok(mod.exports?.includes(AuthenticateOAuthUseCase));
    assert.ok(mod.exports?.includes(IssueReceiptUseCase));
  });

  it("instantiates AuthenticateOAuthUseCase from options", () => {
    const mod = WhoamiOAuthModule.registerAsync({ useFactory: makeOptions });
    const p = findProvider<AuthenticateOAuthUseCase>(
      mod.providers as Provider[],
      AuthenticateOAuthUseCase,
    );
    assert.ok(p);
    assert.ok(p.useFactory(makeOptions()) instanceof AuthenticateOAuthUseCase);
  });

  it("instantiates IssueReceiptUseCase from options", () => {
    const mod = WhoamiOAuthModule.registerAsync({ useFactory: makeOptions });
    const p = findProvider<IssueReceiptUseCase>(
      mod.providers as Provider[],
      IssueReceiptUseCase,
    );
    assert.ok(p);
    assert.ok(p.useFactory(makeOptions()) instanceof IssueReceiptUseCase);
  });

  it("instantiates OAuthCallbackHandler from the two use cases", () => {
    const mod = WhoamiOAuthModule.registerAsync({ useFactory: makeOptions });
    const opts = makeOptions();
    const logger = {
      info: (): void => {},
      warn: (): void => {},
      error: (): void => {},
    };
    const authenticate = new AuthenticateOAuthUseCase({
      accountRepository: opts.accountRepository,
      credentialStore: opts.credentialStore,
      generateId: opts.generateId,
      logger,
    });
    const issue = new IssueReceiptUseCase({
      signer: opts.receiptSigner,
      tokenLifespanMinutes: 60,
    });
    const p = findProvider<OAuthCallbackHandler>(
      mod.providers as Provider[],
      OAuthCallbackHandler,
    );
    assert.ok(p);
    assert.ok(
      p.useFactory(authenticate, issue) instanceof OAuthCallbackHandler,
    );
  });

  it("defaults tokenLifespanMinutes to 60", () => {
    const opts = { ...makeOptions(), tokenLifespanMinutes: undefined };
    const mod = WhoamiOAuthModule.registerAsync({ useFactory: () => opts });
    const p = findProvider<IssueReceiptUseCase>(
      mod.providers as Provider[],
      IssueReceiptUseCase,
    );
    assert.ok(p);
    assert.ok(p.useFactory(opts) instanceof IssueReceiptUseCase);
  });

  it("applies no-op logger when none provided", () => {
    const opts = { ...makeOptions(), logger: undefined };
    const mod = WhoamiOAuthModule.registerAsync({ useFactory: () => opts });
    const p = findProvider<AuthenticateOAuthUseCase>(
      mod.providers as Provider[],
      AuthenticateOAuthUseCase,
    );
    assert.ok(p);
    assert.ok(p.useFactory(opts) instanceof AuthenticateOAuthUseCase);
  });
});
