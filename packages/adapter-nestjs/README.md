# @odysseon/whoami-adapter-nestjs

NestJS integration for `@odysseon/whoami-core`. Provides two modules:

- **`WhoamiModule`** — verifies receipt tokens on incoming requests (the auth guard)
- **`WhoamiOAuthModule`** — wires the full OAuth authentication flow (auto-register + issue receipt)

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-nestjs
# plus a receipt adapter:
npm install @odysseon/whoami-adapter-jose
```

---

## WhoamiModule — protecting routes

`WhoamiModule` installs receipt verification into NestJS's DI container. Register it once at the root level.

### 1. Register the module and global guard

```ts
// app.module.ts
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { WhoamiModule, WhoamiAuthGuard } from "@odysseon/whoami-adapter-nestjs";
import { JoseReceiptVerifier } from "@odysseon/whoami-adapter-jose";

@Module({
  imports: [
    WhoamiModule.registerAsync({
      useFactory: () => ({
        receiptVerifier: new JoseReceiptVerifier({
          secret: process.env.JWT_SECRET!,
          issuer: "my-app",
        }),
      }),
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: WhoamiAuthGuard }],
})
export class AppModule {}
```

### 2. Access the verified identity in a route

```ts
import { Controller, Get } from "@nestjs/common";
import { CurrentIdentity, Public } from "@odysseon/whoami-adapter-nestjs";
import type { Receipt } from "@odysseon/whoami-core";

@Controller("me")
export class ProfileController {
  @Get()
  getProfile(@CurrentIdentity() identity: Receipt) {
    // identity.accountId.value is your FK into your users table
    return { accountId: identity.accountId.value };
  }

  @Public()
  @Get("ping")
  ping() {
    return "pong";
  }
}
```

### Customising token extraction

Default: `Bearer <token>` from the `Authorization` header. Override with any `AuthTokenExtractor`:

```ts
import type { AuthTokenExtractor } from "@odysseon/whoami-adapter-nestjs";

class CookieTokenExtractor implements AuthTokenExtractor {
  extract(request: unknown): string | null {
    const req = request as { cookies?: { token?: string } };
    return req.cookies?.token ?? null;
  }
}

WhoamiModule.registerAsync({
  useFactory: () => ({
    receiptVerifier: new JoseReceiptVerifier({
      secret: process.env.JWT_SECRET!,
    }),
    tokenExtractor: new CookieTokenExtractor(),
  }),
});
```

---

## WhoamiOAuthModule — OAuth authentication

`WhoamiOAuthModule` wires `AuthenticateOAuthUseCase` + `IssueReceiptUseCase` into a single injectable `OAuthCallbackHandler`. Register it in your auth module.

### 1. Register WhoamiOAuthModule

```ts
// auth.module.ts
import { WhoamiOAuthModule } from "@odysseon/whoami-adapter-nestjs";
import { JoseReceiptSigner } from "@odysseon/whoami-adapter-jose";

@Module({
  imports: [
    WhoamiOAuthModule.registerAsync({
      imports: [ConfigModule, DatabaseModule],
      inject: [ConfigService, ACCOUNT_REPO_TOKEN, CRED_STORE_TOKEN],
      useFactory: (config, accountRepository, credentialStore) => ({
        accountRepository,
        credentialStore,
        receiptSigner: new JoseReceiptSigner({
          secret: config.get("JWT_SECRET"),
        }),
        generateId: () => crypto.randomUUID(),
        tokenLifespanMinutes: 60,
      }),
    }),
  ],
  controllers: [AuthController],
})
export class AuthModule {}
```

### 2. Use OAuthCallbackHandler in your callback controller

```ts
// auth.controller.ts
import { OAuthCallbackHandler } from "@odysseon/whoami-adapter-nestjs";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly oauthHandler: OAuthCallbackHandler,
    private readonly userService: UserService,
  ) {}

  @Public()
  @Get("google/callback")
  @UseGuards(GoogleOAuthGuard)
  async googleCallback(@OAuthProfile() profile: GoogleProfile) {
    const receipt = await this.oauthHandler.handle({
      email: profile.email,
      provider: "google",
      providerId: profile.sub,
    });

    // Your domain — create or hydrate your user record
    await this.userService.getOrCreate(receipt.accountId.value, profile);

    return { token: receipt.token, expiresAt: receipt.expiresAt };
  }
}
```

### OAuthProfile shape

```ts
interface OAuthProfile {
  email: string; // the email from the provider
  provider: string; // "google" | "github" | your string
  providerId: string; // the provider's stable user ID
}
```

| Field        | Google                    | GitHub                    |
| ------------ | ------------------------- | ------------------------- |
| `email`      | `profile.emails[0].value` | `profile.emails[0].value` |
| `provider`   | `"google"`                | `"github"`                |
| `providerId` | `profile.id`              | `String(profile.id)`      |

---

## HTTP status mapping

`WhoamiExceptionFilter` is installed automatically by `WhoamiModule` and translates core domain errors:

| Domain error                | HTTP status               |
| --------------------------- | ------------------------- |
| `AuthenticationError`       | 401 Unauthorized          |
| `InvalidReceiptError`       | 401 Unauthorized          |
| `AccountAlreadyExistsError` | 409 Conflict              |
| `InvalidEmailError`         | 400 Bad Request           |
| `InvalidConfigurationError` | 500 Internal Server Error |
| Any other `DomainError`     | 400 Bad Request           |

---

## How your entities link to Account

whoami returns `receipt.accountId` — a typed wrapper around your identity primitive. Use `receipt.accountId.value` as a foreign key in your own tables:

```
whoami:  accounts { id, email }
yours:   users    { id, account_id ← receipt.accountId.value, display_name, ... }
         posts    { id, author_id  → users.id }
```

See the [example-nestjs](../example-nestjs/README.md) package for a full working application.
