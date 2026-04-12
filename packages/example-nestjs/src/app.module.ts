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
import { AccountsModule } from "./accounts/accounts.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { IdentityModule } from "./identity/identity.module.js";
import {
  InMemoryAccountRepository,
  InMemoryOAuthCredentialStore,
  InMemoryPasswordCredentialStore,
} from "./infrastructure/in-memory.stores.js";

@Module({
  imports: [
    ConfigModule.forRoot(),
    WhoamiModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (...args: unknown[]): Promise<WhoamiModuleOptions> => {
        const configService = args[0] as ConfigService;
        const joseSecret = configService.get(
          "JOSE_SECRET",
          "this-is-a-very-long-secret-key-that-is-at-least-32-chars!!",
        );

        return {
          // Core config - only ports, no use-cases!
          accountRepo: new InMemoryAccountRepository(),
          receiptSigner: new JoseReceiptSigner({
            secret: joseSecret,
            issuer: "whoami-example",
          }),
          receiptVerifier: new JoseReceiptVerifier({
            secret: joseSecret,
            issuer: "whoami-example",
          }),
          tokenLifespanMinutes: 60,
          logger: console,
          idGenerator: () => crypto.randomUUID(),

          password: {
            passwordHasher: new Argon2PasswordHasher(),
            passwordStore: new InMemoryPasswordCredentialStore(),
          },
          oauth: {
            oauthStore: new InMemoryOAuthCredentialStore(),
          },
        };
      },
    }),
    AccountsModule,
    AuthModule,
    IdentityModule,
  ],
})
export class AppModule {}
