import type {
  Type,
  ForwardReference,
  DynamicModule,
  InjectionToken,
  OptionalFactoryDependency,
} from "@nestjs/common";
import type { AuthModule, ReceiptVerifier } from "@odysseon/whoami-core";
import type { AuthTokenExtractor } from "./extractors/auth-token-extractor.port.js";

export interface WhoamiModuleOptions {
  readonly modules: readonly AuthModule[];
  readonly receiptVerifier: ReceiptVerifier;
  readonly tokenExtractor?: AuthTokenExtractor;
}

export interface WhoamiModuleAsyncOptions {
  readonly imports?: Array<
    Type<unknown> | ForwardReference | DynamicModule | Promise<DynamicModule>
  >;
  readonly inject?: Array<InjectionToken | OptionalFactoryDependency>;
  readonly useFactory: (
    ...args: unknown[]
  ) => Promise<WhoamiModuleOptions> | WhoamiModuleOptions;
}
