# @odysseon/whoami-adapter-prisma

Prisma implementations of all whoami store ports. Provides `createPrismaAdapters` — a single factory that builds every repository and store your auth modules need from a single `PrismaClient` instance.

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-prisma
```

This adapter uses structural typing for the Prisma client — it does **not** depend on `@prisma/client` directly. Pass your own generated `PrismaClient` instance and it will work.

## Schema setup

Copy the Prisma models into your `schema.prisma`. The adapter ships a fragment at `node_modules/@odysseon/whoami-adapter-prisma/schema.prisma` that you can append to your schema:

```bash
cat node_modules/@odysseon/whoami-adapter-prisma/schema.prisma >> prisma/schema.prisma
```

Or copy the models manually. The fragment defines these tables:

```prisma
model Account {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())

  passwordHash PasswordHash?
  resetTokens  PasswordResetToken[]
  oauthCreds   OAuthCredential[]
  magicLinks   MagicLinkToken[]

  // ============================================
  // 👇 CONSUMER ACTION REQUIRED
  // ============================================
  // Uncomment the line below to link your User model:
  // user User?
  // ============================================
}

model PasswordHash      { ... }  // @@map("password_hashes")
model PasswordResetToken { ... } // @@map("password_reset_tokens")
model OAuthCredential   { ... }  // @@map("oauth_credentials")
model MagicLinkToken    { ... }  // @@map("magic_link_tokens")
```

After adding the models, run:

```bash
npx prisma migrate dev --name add-whoami-tables
```

## Usage

### Express / plain Node.js

```ts
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { createPrismaAdapters } from "@odysseon/whoami-adapter-prisma";
import { PasswordModule } from "@odysseon/whoami-core/password";
import { MagicLinkModule } from "@odysseon/whoami-core/magiclink";
import { OAuthModule } from "@odysseon/whoami-core/oauth";
import { JoseReceiptSigner } from "@odysseon/whoami-adapter-jose";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { WebCryptoSecureTokenAdapter } from "@odysseon/whoami-adapter-webcrypto";

// 1. Create the Prisma client (Prisma 7+ driver adapter style)
const prismaAdapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter: prismaAdapter });

// 2. Build all adapters at once
const {
  accountRepo,
  passwordHashStore,
  resetTokenStore,
  oauthStore,
  magicLinkStore,
} = createPrismaAdapters(prisma);

// 3. Wire into whoami modules
const signer = new JoseReceiptSigner({
  secret: process.env.JWT_SECRET!,
  issuer: "my-app",
});

const password = PasswordModule({
  accountRepo,
  passwordStore: passwordHashStore,
  resetTokenStore,
  passwordHasher: new Argon2PasswordHasher(),
  receiptSigner: signer,
  idGenerator: () => crypto.randomUUID(),
  logger: console,
  secureToken: new WebCryptoSecureTokenAdapter(),
});

const oauth = OAuthModule({
  accountRepo,
  oauthStore,
  receiptSigner: signer,
  idGenerator: () => crypto.randomUUID(),
  logger: console,
});

const magicLink = MagicLinkModule({
  accountRepo,
  magicLinkStore,
  receiptSigner: signer,
  idGenerator: () => crypto.randomUUID(),
  logger: console,
  secureToken: new WebCryptoSecureTokenAdapter(),
});
```

### NestJS (with `WhoamiModule.registerAsync`)

```ts
// app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { WhoamiModule } from "@odysseon/whoami-adapter-nestjs";
import { PasswordModule } from "@odysseon/whoami-core/password";
import { OAuthModule } from "@odysseon/whoami-core/oauth";
import {
  JoseReceiptSigner,
  JoseReceiptVerifier,
} from "@odysseon/whoami-adapter-jose";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { WebCryptoSecureTokenAdapter } from "@odysseon/whoami-adapter-webcrypto";
import { createPrismaAdapters } from "@odysseon/whoami-adapter-prisma";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

@Module({
  imports: [
    ConfigModule.forRoot(),
    WhoamiModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>("JWT_SECRET")!;
        const signer = new JoseReceiptSigner({ secret, issuer: "my-app" });
        const verifier = new JoseReceiptVerifier({ secret, issuer: "my-app" });

        const prisma = new PrismaClient({
          adapter: new PrismaPg({
            connectionString: config.get("DATABASE_URL")!,
          }),
        });
        const {
          accountRepo,
          passwordHashStore,
          resetTokenStore,
          oauthStore,
          magicLinkStore,
        } = createPrismaAdapters(prisma);

        const secureToken = new WebCryptoSecureTokenAdapter();

        return {
          modules: [
            PasswordModule({
              accountRepo,
              passwordStore: passwordHashStore,
              resetTokenStore,
              passwordHasher: new Argon2PasswordHasher(),
              receiptSigner: signer,
              idGenerator: () => crypto.randomUUID(),
              logger: console,
              secureToken,
            }),
            OAuthModule({
              accountRepo,
              oauthStore,
              receiptSigner: signer,
              idGenerator: () => crypto.randomUUID(),
              logger: console,
            }),
          ],
          receiptVerifier: verifier,
        };
      },
    }),
  ],
})
export class AppModule {}
```

## What `createPrismaAdapters` returns

```ts
interface PrismaAdapters {
  accountRepo: PrismaAccountRepository; // implements AccountRepository
  passwordHashStore: PrismaPasswordHashStore; // implements PasswordHashStore
  resetTokenStore: PrismaPasswordResetTokenStore; // implements PasswordResetTokenStore
  oauthStore: PrismaOAuthCredentialStore; // implements OAuthCredentialStore
  magicLinkStore: PrismaMagicLinkTokenStore; // implements MagicLinkTokenStore
}
```

Each concrete class is also exported individually if you need to use them directly.

## Port-to-store mapping

| whoami port               | `PrismaAdapters` key | Prisma model         |
| ------------------------- | -------------------- | -------------------- |
| `AccountRepository`       | `accountRepo`        | `account`            |
| `PasswordHashStore`       | `passwordHashStore`  | `passwordHash`       |
| `PasswordResetTokenStore` | `resetTokenStore`    | `passwordResetToken` |
| `OAuthCredentialStore`    | `oauthStore`         | `oAuthCredential`    |
| `MagicLinkTokenStore`     | `magicLinkStore`     | `magicLinkToken`     |

## Linking your User model

The `Account` model in the schema fragment is intentionally minimal — it stores only what whoami needs (`id`, `email`). Your application's `User` record lives in your own schema, linked by a foreign key:

```prisma
// Your schema
model User {
  id          String  @id @default(cuid())
  accountId   String  @unique   // FK to whoami's Account
  displayName String
  avatarUrl   String?
}
```

The fragment includes a commented-out relation to `User` — uncomment it after adding your `User` model:

```prisma
model Account {
  // ...existing fields...
  user User?   // ← uncomment this
}
```

## Token cleanup (magic links and password resets)

Expired tokens accumulate in `magic_link_tokens` and `password_reset_tokens`. Both stores expose a `deleteExpired(before: Date)` method. Run this periodically via a cron job or a database scheduled task:

```ts
const { magicLinkStore, resetTokenStore } = createPrismaAdapters(prisma);

const now = new Date();
await magicLinkStore.deleteExpired(now); // MagicLinkTokenStore
await resetTokenStore.deleteExpiredBefore(now); // PasswordResetTokenStore
```

## License

[MIT](LICENSE)
