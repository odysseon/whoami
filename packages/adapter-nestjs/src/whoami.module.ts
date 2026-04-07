import { DynamicModule, Module, Provider } from "@nestjs/common";
import {
  VerifyReceiptUseCase,
  type ReceiptVerifier,
} from "@odysseon/whoami-core";
import { WhoamiAuthGuard } from "./guards/whoami-auth.guard.js";
import { WhoamiExceptionFilter } from "./filters/whoami-exception.filter.js";
import { BearerTokenExtractor } from "./extractors/bearer-token.extractor.js";
import { AuthTokenExtractor } from "./extractors/auth-token-extractor.port.js";

export interface WhoamiModuleOptions {
  verifier: ReceiptVerifier;
}

export interface WhoamiModuleAsyncOptions {
  imports?: DynamicModule["imports"];
  useFactory: (
    ...args: unknown[]
  ) => WhoamiModuleOptions | Promise<WhoamiModuleOptions>;
  inject?: Provider[];
}

@Module({})
export class WhoamiModule {
  static register(options: WhoamiModuleOptions): DynamicModule {
    const providers = WhoamiModule.buildProviders(options);
    return {
      module: WhoamiModule,
      providers,
      exports: providers,
    };
  }

  static registerAsync(options: WhoamiModuleAsyncOptions): DynamicModule {
    const asyncProvider: Provider = {
      provide: "WHOAMI_MODULE_OPTIONS",
      useFactory: options.useFactory,
      inject: (options.inject ?? []) as never[],
    };

    const verifyReceiptProvider: Provider = {
      provide: VerifyReceiptUseCase,
      useFactory: (opts: WhoamiModuleOptions) =>
        new VerifyReceiptUseCase(opts.verifier),
      inject: ["WHOAMI_MODULE_OPTIONS"],
    };

    const tokenExtractorProvider: Provider = {
      provide: AuthTokenExtractor,
      useClass: BearerTokenExtractor,
    };

    const providers: Provider[] = [
      asyncProvider,
      verifyReceiptProvider,
      tokenExtractorProvider,
      WhoamiAuthGuard,
      WhoamiExceptionFilter,
    ];

    return {
      module: WhoamiModule,
      imports: options.imports ?? [],
      providers,
      exports: providers,
    };
  }

  private static buildProviders(options: WhoamiModuleOptions): Provider[] {
    return [
      {
        provide: VerifyReceiptUseCase,
        useValue: new VerifyReceiptUseCase(options.verifier),
      },
      {
        provide: AuthTokenExtractor,
        useClass: BearerTokenExtractor,
      },
      WhoamiAuthGuard,
      WhoamiExceptionFilter,
    ];
  }
}
