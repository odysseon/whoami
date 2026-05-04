import { Global, Module } from "@nestjs/common";
import type { DynamicModule, FactoryProvider } from "@nestjs/common";
import { buildProviders, buildAsyncProviders } from "./whoami.providers.js";
import type {
  WhoamiModuleOptions,
  WhoamiModuleAsyncOptions,
} from "./whoami.options.js";

export * from "./tokens.js";
export type { WhoamiModuleOptions, WhoamiModuleAsyncOptions };

@Global()
@Module({})
export class WhoamiModule {
  static register(options: WhoamiModuleOptions): DynamicModule {
    const { providers, exports } = buildProviders(options);
    return { module: WhoamiModule, providers, exports };
  }

  static registerAsync(options: WhoamiModuleAsyncOptions): DynamicModule {
    const optionsProvider: FactoryProvider = {
      provide: "WHOAMI_OPTIONS",
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };
    const { providers, exports } = buildAsyncProviders(optionsProvider);
    return {
      module: WhoamiModule,
      imports: options.imports ?? [],
      providers,
      exports,
    };
  }
}
