import type { Provider, FactoryProvider } from "@nestjs/common";
import { APP_GUARD, APP_FILTER } from "@nestjs/core";
import { WhoamiAuthGuard } from "./guards/whoami-auth.guard.js";
import { WhoamiExceptionFilter } from "./filters/whoami-exception.filter.js";
import { BearerTokenExtractor } from "./extractors/bearer-token.extractor.js";
import { AuthTokenExtractor } from "./extractors/auth-token-extractor.port.js";
import { OAuthCallbackHandler } from "./oauth/oauth-callback-handler.js";
import { WHOAMI_RECEIPT_VERIFIER, moduleToken } from "./tokens.js";
import type { WhoamiModuleOptions } from "./whoami.options.js";

const AUTO_PROVIDERS: Provider[] = [
  { provide: APP_GUARD, useClass: WhoamiAuthGuard },
  { provide: APP_FILTER, useClass: WhoamiExceptionFilter },
];

export function buildProviders(options: WhoamiModuleOptions): {
  providers: Provider[];
  exports: Provider[];
} {
  const extractor = options.tokenExtractor ?? new BearerTokenExtractor();

  const core: Provider[] = [
    { provide: WHOAMI_RECEIPT_VERIFIER, useValue: options.receiptVerifier },
    { provide: AuthTokenExtractor, useValue: extractor },
    ...options.modules.map((mod) => ({
      provide: moduleToken(mod.kind),
      useValue: mod,
    })),
    {
      provide: moduleToken("oauth"),
      useValue: options.modules.find((m) => m.kind === "oauth") ?? null,
    },
    OAuthCallbackHandler,
  ];

  return { providers: [...core, ...AUTO_PROVIDERS], exports: core };
}

export function buildAsyncProviders(optionsProvider: FactoryProvider): {
  providers: Provider[];
  exports: Provider[];
} {
  const resolve =
    (key: string) =>
    (opts: WhoamiModuleOptions): unknown =>
      opts.modules.find((m) => m.kind === key) ?? null;

  const core: Provider[] = [
    optionsProvider,
    {
      provide: WHOAMI_RECEIPT_VERIFIER,
      useFactory: (opts: WhoamiModuleOptions) => opts.receiptVerifier,
      inject: ["WHOAMI_OPTIONS"],
    },
    {
      provide: AuthTokenExtractor,
      useFactory: (opts: WhoamiModuleOptions) =>
        opts.tokenExtractor ?? new BearerTokenExtractor(),
      inject: ["WHOAMI_OPTIONS"],
    },
    {
      provide: "WHOAMI_MODULES",
      useFactory: (opts: WhoamiModuleOptions) => opts.modules,
      inject: ["WHOAMI_OPTIONS"],
    },
    {
      provide: moduleToken("password"),
      useFactory: resolve("password"),
      inject: ["WHOAMI_OPTIONS"],
    },
    {
      provide: moduleToken("oauth"),
      useFactory: resolve("oauth"),
      inject: ["WHOAMI_OPTIONS"],
    },
    {
      provide: moduleToken("magiclink"),
      useFactory: resolve("magiclink"),
      inject: ["WHOAMI_OPTIONS"],
    },
    OAuthCallbackHandler,
  ];

  return { providers: [...core, ...AUTO_PROVIDERS], exports: core };
}
