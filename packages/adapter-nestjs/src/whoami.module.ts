import {
  DynamicModule,
  FactoryProvider,
  Module,
  ModuleMetadata,
  Type,
} from "@nestjs/common";
import type { ReceiptVerifier } from "@odysseon/whoami-core";
import { BearerTokenExtractor } from "./extractors/bearer-token.extractor.js";

// ── DI token ─────────────────────────────────────────────────────────────────

/** Injection token for the {@link ReceiptVerifier} bound by {@link WhoamiModule}. */
export const WHOAMI_RECEIPT_VERIFIER = Symbol("WHOAMI_RECEIPT_VERIFIER");

// ── Options shape ─────────────────────────────────────────────────────────────

/**
 * Options accepted by {@link WhoamiModule.register} and {@link WhoamiModule.registerAsync}.
 * @public
 */
export interface WhoamiModuleOptions {
  /**
   * The {@link ReceiptVerifier} implementation that validates signed receipt tokens.
   *
   * Typically an instance of `JoseReceiptVerifier` from `@odysseon/whoami-adapter-jose`.
   */
  receiptVerifier: ReceiptVerifier;
}

// ── Async options ─────────────────────────────────────────────────────────────

/**
 * Async configuration options for {@link WhoamiModule.registerAsync}.
 * @public
 */
export interface WhoamiModuleAsyncOptions extends Pick<
  ModuleMetadata,
  "imports"
> {
  /**
   * Optional list of providers to inject into `useFactory`.
   */
  inject?: FactoryProvider["inject"];

  /**
   * Factory function that resolves {@link WhoamiModuleOptions}.
   * The return value may be synchronous or a `Promise`.
   */
  useFactory: (
    ...args: unknown[]
  ) => WhoamiModuleOptions | Promise<WhoamiModuleOptions>;

  /**
   * Optional class with a `createWhoamiOptions()` method.
   * Not implemented — prefer `useFactory` for simplicity.
   */
  useClass?: Type<{
    createWhoamiOptions(): WhoamiModuleOptions | Promise<WhoamiModuleOptions>;
  }>;
}

// ── Module ────────────────────────────────────────────────────────────────────

/**
 * NestJS integration module for `@odysseon/whoami-core`.
 *
 * Registers {@link WHOAMI_RECEIPT_VERIFIER} and {@link BearerTokenExtractor}
 * as providers so that {@link WhoamiAuthGuard} can be injected application-wide.
 *
 * ### Synchronous registration
 * ```ts
 * WhoamiModule.register({
 *   receiptVerifier: new JoseReceiptVerifier({ secret, issuer }),
 * })
 * ```
 *
 * ### Asynchronous registration (preferred for env-driven config)
 * ```ts
 * WhoamiModule.registerAsync({
 *   useFactory: (): WhoamiModuleOptions => ({
 *     receiptVerifier: new JoseReceiptVerifier({
 *       secret: process.env.JOSE_SECRET!,
 *       issuer: 'my-app',
 *     }),
 *   }),
 * })
 * ```
 *
 * @public
 */
@Module({})
export class WhoamiModule {
  /**
   * Registers the module with a pre-constructed {@link WhoamiModuleOptions} object.
   *
   * @param options - Synchronous module options.
   * @returns A {@link DynamicModule} ready to import.
   */
  public static register(options: WhoamiModuleOptions): DynamicModule {
    return {
      module: WhoamiModule,
      providers: [
        {
          provide: WHOAMI_RECEIPT_VERIFIER,
          useValue: options.receiptVerifier,
        },
        BearerTokenExtractor,
      ],
      exports: [WHOAMI_RECEIPT_VERIFIER, BearerTokenExtractor],
    };
  }

  /**
   * Registers the module using an async factory, enabling injection of
   * NestJS providers (e.g. `ConfigService`) into the options factory.
   *
   * @param asyncOptions - Async module options.
   * @returns A {@link DynamicModule} ready to import.
   */
  public static registerAsync(
    asyncOptions: WhoamiModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: WhoamiModule,
      imports: asyncOptions.imports ?? [],
      providers: [
        {
          provide: WHOAMI_RECEIPT_VERIFIER,
          useFactory: async (...args: unknown[]): Promise<ReceiptVerifier> => {
            const opts = await asyncOptions.useFactory(...args);
            return opts.receiptVerifier;
          },
          inject: asyncOptions.inject ?? [],
        },
        BearerTokenExtractor,
      ],
      exports: [WHOAMI_RECEIPT_VERIFIER, BearerTokenExtractor],
    };
  }
}
