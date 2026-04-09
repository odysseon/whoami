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
import {
  IssueReceiptUseCase,
  VerifyReceiptUseCase,
} from "@odysseon/whoami-core/internal";

@Module({
  imports: [
    ConfigModule.forRoot(),
    WhoamiModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService,
      ): Promise<WhoamiModuleOptions> => {
        const joseSecret = configService.get(
          "JOSE_SECRET",
          "this-is-a-very-long-secret-key-that-is-at-least-32-chars!!",
        );

        return {
          accountRepo: new InMemoryAccountRepository(),
          tokenSigner: new IssueReceiptUseCase({
            signer: new JoseReceiptSigner({
              secret: joseSecret,
              issuer: "whoami-example",
            }),
            tokenLifespanMinutes: 60,
          }),
          verifyReceipt: new VerifyReceiptUseCase(
            new JoseReceiptVerifier({
              secret: joseSecret,
              issuer: "whoami-example",
            }),
          ),
          logger: console,
          generateId: () => crypto.randomUUID(),
          password: {
            hashManager: new Argon2PasswordHasher(),
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
