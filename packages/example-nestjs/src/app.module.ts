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
import { PasswordModule, OAuthModule } from "@odysseon/whoami-core";
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
        const config = args[0] as ConfigService;
        const secret = config.get(
          "JOSE_SECRET",
          "this-is-a-very-long-secret-key-that-is-at-least-32-chars!!",
        );

        const accountRepo = new InMemoryAccountRepository();
        const receiptSigner = new JoseReceiptSigner({
          secret,
          issuer: "whoami-example",
        });
        const receiptVerifier = new JoseReceiptVerifier({
          secret,
          issuer: "whoami-example",
        });
        const idGenerator = { generate: (): string => crypto.randomUUID() };
        const logger = console;
        const clock = { now: (): Date => new Date() };
        const secureToken = {
          generateToken: (): string => crypto.randomUUID().replace(/-/g, ""),
          hashToken: async (token: string): Promise<string> => {
            const buf = await crypto.subtle.digest(
              "SHA-256",
              new TextEncoder().encode(token),
            );
            return Array.from(new Uint8Array(buf))
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("");
          },
        };

        return {
          receiptVerifier,
          modules: [
            PasswordModule({
              accountRepo,
              passwordStore: new InMemoryPasswordCredentialStore(),
              passwordHasher: new Argon2PasswordHasher(),
              receiptSigner,
              idGenerator,
              logger,
              clock,
              secureToken,
            }),
            OAuthModule({
              accountRepo,
              oauthStore: new InMemoryOAuthCredentialStore(),
              receiptSigner,
              idGenerator,
              logger,
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
