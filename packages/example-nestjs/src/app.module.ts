import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import {
  WhoamiModule,
  type WhoamiModuleOptions,
} from "@odysseon/whoami-adapter-nestjs";
import {
  JoseReceiptSigner,
  JoseReceiptVerifier,
} from "@odysseon/whoami-adapter-jose";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { WebCryptoSecureTokenAdapter } from "@odysseon/whoami-adapter-webcrypto";
import {
  PasswordModule,
  OAuthModule,
  MagicLinkModule,
} from "@odysseon/whoami-core";
import { AccountsModule } from "./accounts/accounts.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { IdentityModule } from "./identity/identity.module.js";
import { prismaAdapters } from "./infrastructure/prisma-repositories.js";

@Module({
  imports: [
    ConfigModule.forRoot(),
    WhoamiModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (...args: unknown[]): Promise<WhoamiModuleOptions> => {
        const config = args[0] as ConfigService;
        const secret = config.get(
          "JOSE_SECRET",
          "this-is-a-very-long-secret-key-that-is-at-least-32-chars!!",
        );

        const receiptSigner = new JoseReceiptSigner({
          secret,
          issuer: "whoami-example",
        });
        const receiptVerifier = new JoseReceiptVerifier({
          secret,
          issuer: "whoami-example",
        });
        const passwordHasher = new Argon2PasswordHasher();
        const secureToken = new WebCryptoSecureTokenAdapter();
        const idGenerator = { generate: (): string => crypto.randomUUID() };
        const logger = console;
        const clock = { now: (): Date => new Date() };
        const tokenLifespanMinutes = 60;
        const resetTokenLifespanMinutes = 15;
        const magicLinkLifespanMinutes = 15;

        return {
          receiptVerifier,
          modules: [
            PasswordModule({
              accountRepo: prismaAdapters.accountRepo,
              passwordHashStore: prismaAdapters.passwordHashStore,
              resetTokenStore: prismaAdapters.resetTokenStore,
              passwordHasher,
              receiptSigner,
              idGenerator,
              logger,
              clock,
              secureToken,
              tokenLifespanMinutes,
              resetTokenLifespanMinutes,
            }),
            OAuthModule({
              accountRepo: prismaAdapters.accountRepo,
              oauthStore: prismaAdapters.oauthStore,
              receiptSigner,
              idGenerator,
              logger,
              tokenLifespanMinutes,
            }),
            MagicLinkModule({
              accountRepo: prismaAdapters.accountRepo,
              magicLinkStore: prismaAdapters.magicLinkStore,
              receiptSigner,
              idGenerator,
              logger,
              clock,
              secureToken,
              tokenLifespanMinutes: magicLinkLifespanMinutes,
            }),
          ],
        };
      },
    }),
    AccountsModule,
    AuthModule,
    IdentityModule,
  ],
})
export class AppModule {}
