import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  AuthenticateOAuthUseCase,
  IssueReceiptUseCase,
} from "@odysseon/whoami-core";
import type { Provider } from "@nestjs/common";
import {
  WhoamiOAuthModule,
  type WhoamiOAuthModuleOptions,
} from "./whoami-oauth.module.js";
import { OAuthCallbackHandler } from "./oauth-callback-handler.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    },
    receiptSigner: {
      sign: async (): Promise<string> => "signed.token",
    },
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("WhoamiOAuthModule", () => {
  it("returns a valid dynamic module structure", () => {
    const mod = WhoamiOAuthModule.registerAsync({ useFactory: makeOptions });

    assert.equal(mod.module, WhoamiOAuthModule);
    assert.ok(Array.isArray(mod.providers) && mod.providers.length > 0);
    assert.ok(Array.isArray(mod.exports) && mod.exports.length > 0);
  });

  it("exports OAuthCallbackHandler, AuthenticateOAuthUseCase, and IssueReceiptUseCase", () => {
    const mod = WhoamiOAuthModule.registerAsync({ useFactory: makeOptions });

    assert.ok(mod.exports?.includes(OAuthCallbackHandler));
    assert.ok(mod.exports?.includes(AuthenticateOAuthUseCase));
    assert.ok(mod.exports?.includes(IssueReceiptUseCase));
  });

  it("instantiates AuthenticateOAuthUseCase from module options", () => {
    const mod = WhoamiOAuthModule.registerAsync({ useFactory: makeOptions });
    const provider = findProvider<AuthenticateOAuthUseCase>(
      mod.providers as Provider[],
      AuthenticateOAuthUseCase,
    );

    assert.ok(provider);
    assert.ok(
      provider.useFactory(makeOptions()) instanceof AuthenticateOAuthUseCase,
    );
  });

  it("instantiates IssueReceiptUseCase from module options", () => {
    const mod = WhoamiOAuthModule.registerAsync({ useFactory: makeOptions });
    const provider = findProvider<IssueReceiptUseCase>(
      mod.providers as Provider[],
      IssueReceiptUseCase,
    );

    assert.ok(provider);
    assert.ok(
      provider.useFactory(makeOptions()) instanceof IssueReceiptUseCase,
    );
  });

  it("instantiates OAuthCallbackHandler from the two use cases", () => {
    const mod = WhoamiOAuthModule.registerAsync({ useFactory: makeOptions });
    const opts = makeOptions();
    const logger = opts.logger ?? {
      info: (): void => {},
      warn: (): void => {},
      error: (): void => {},
    };

    const authenticateOAuth = new AuthenticateOAuthUseCase(
      opts.accountRepository,
      opts.credentialStore,
      opts.generateId,
      logger,
    );
    const issueReceipt = new IssueReceiptUseCase(opts.receiptSigner, 60);

    const provider = findProvider<OAuthCallbackHandler>(
      mod.providers as Provider[],
      OAuthCallbackHandler,
    );

    assert.ok(provider);
    assert.ok(
      provider.useFactory(authenticateOAuth, issueReceipt) instanceof
        OAuthCallbackHandler,
    );
  });

  it("defaults tokenLifespanMinutes to 60 when not provided", () => {
    const opts: WhoamiOAuthModuleOptions = {
      ...makeOptions(),
      tokenLifespanMinutes: undefined,
    };
    const mod = WhoamiOAuthModule.registerAsync({ useFactory: () => opts });
    const provider = findProvider<IssueReceiptUseCase>(
      mod.providers as Provider[],
      IssueReceiptUseCase,
    );

    assert.ok(provider);
    assert.ok(provider.useFactory(opts) instanceof IssueReceiptUseCase);
  });

  it("applies no-op logger when none is provided", () => {
    const opts: WhoamiOAuthModuleOptions = {
      ...makeOptions(),
      logger: undefined,
    };
    const mod = WhoamiOAuthModule.registerAsync({ useFactory: () => opts });
    const provider = findProvider<AuthenticateOAuthUseCase>(
      mod.providers as Provider[],
      AuthenticateOAuthUseCase,
    );

    assert.ok(provider);
    assert.ok(provider.useFactory(opts) instanceof AuthenticateOAuthUseCase);
  });
});
