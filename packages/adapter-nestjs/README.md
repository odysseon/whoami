# @odysseon/whoami-adapter-nestjs

NestJS integration for `@odysseon/whoami-core`. Provides `WhoamiModule`, a global dynamic module that wires auth modules into the NestJS DI container — with the guard and exception filter auto-registered.

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-nestjs
npm install @odysseon/whoami-adapter-jose          # receipt signing
npm install @odysseon/whoami-adapter-argon2         # password hashing (if using password auth)
npm install @odysseon/whoami-adapter-webcrypto      # secure token hashing (if using password reset or magic links)
npm install @odysseon/whoami-adapter-prisma         # Prisma store implementations (recommended)
```

---

## WhoamiModule setup

Register once in your root `AppModule`. Pass the pre-built auth modules and a receipt verifier:

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
        const { accountRepo, passwordHashStore, resetTokenStore, oauthStore } =
          createPrismaAdapters(prisma);

        const secureToken = new WebCryptoSecureTokenAdapter();
        const clock = { now: () => new Date() };

        return {
          modules: [
            PasswordModule({
              accountRepo,
              passwordHashStore,
              resetTokenStore,
              passwordHasher: new Argon2PasswordHasher(),
              receiptSigner: signer,
              idGenerator: { generate: () => crypto.randomUUID() },
              logger: console,
              clock,
              secureToken,
            }),
            OAuthModule({
              accountRepo,
              oauthStore,
              receiptSigner: signer,
              idGenerator: { generate: () => crypto.randomUUID() },
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

`WhoamiModule` is `@Global()`. `WhoamiAuthGuard` and `WhoamiExceptionFilter` are registered automatically via `APP_GUARD` / `APP_FILTER` — do **not** add them yourself.

---

## WhoamiModuleOptions

| Option            | Type                    | Required | Description                                                                       |
| ----------------- | ----------------------- | -------- | --------------------------------------------------------------------------------- |
| `modules`         | `readonly AuthModule[]` | ✅       | Auth modules to register (e.g. `PasswordModule(...)`, `OAuthModule(...)`)         |
| `receiptVerifier` | `ReceiptVerifier`       | ✅       | Verifies incoming receipt tokens — use `JoseReceiptVerifier`                      |
| `tokenExtractor`  | `AuthTokenExtractor`    | ✗        | Override token extraction (default: `Bearer <token>` from `Authorization` header) |

---

## Protecting routes

Every route is protected by default. You can bypass authentication with `@Public()` or use `@OptionalAuth()` for mixed-access endpoints:

```ts
import { Controller, Get, Post, Body } from "@nestjs/common";
import {
  Public,
  OptionalAuth,
  CurrentIdentity,
} from "@odysseon/whoami-adapter-nestjs";
import type { RequestIdentity } from "@odysseon/whoami-adapter-nestjs";

@Controller("me")
export class ProfileController {
  @Get()
  getProfile(@CurrentIdentity() identity: RequestIdentity) {
    return { accountId: identity.accountId };
  }

  @Public()
  @Get("ping")
  ping() {
    return "pong";
  }

  @OptionalAuth()
  @Get("optional-profile")
  getOptionalProfile(
    @CurrentIdentity({ required: false }) identity?: RequestIdentity,
  ) {
    if (identity) {
      return { accountId: identity.accountId, status: "logged-in" };
    }
    return { status: "guest" };
  }
}
```

---

## Injecting auth modules

Modules are injected by kind via `moduleToken(kind)`:

```ts
import { Controller, Post, Body, Inject } from "@nestjs/common";
import { Public, moduleToken } from "@odysseon/whoami-adapter-nestjs";
import type { PasswordMethods } from "@odysseon/whoami-core/password";

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(moduleToken("password")) private readonly password: PasswordMethods,
  ) {}

  @Public()
  @Post("login")
  async login(@Body() dto: { email: string; password: string }) {
    const { receipt } = await this.password.authenticateWithPassword(dto);
    return { token: receipt.token, expiresAt: receipt.expiresAt };
  }
}
```

---

## Decorators

| Decorator                                            | Description                                                                      |
| ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| `@Public()`                                          | Bypasses `WhoamiAuthGuard` on a route or controller                              |
| `@OptionalAuth()`                                    | Allows access without a token, but parses & verifies it if present               |
| `@CurrentIdentity(options?: { required?: boolean })` | Resolves `RequestIdentity` (`{ accountId, expiresAt }`) from the current request |

_Note: By default, `@CurrentIdentity()` throws if no identity is present. Setting `{ required: false }` allows it to return `undefined` on `@OptionalAuth()` routes when a token is not provided._

_Note: `WhoamiAuthGuard` verifies the receipt but intentionally strips the sensitive raw token before attaching the identity to the request._

---

## OAuthCallbackHandler

An injectable service that delegates to the `OAuthModule`. Use it in your OAuth callback controller:

```ts
import { OAuthCallbackHandler } from "@odysseon/whoami-adapter-nestjs";

@Controller("auth")
export class AuthController {
  constructor(private readonly oauthHandler: OAuthCallbackHandler) {}

  @Public()
  @Get("google/callback")
  @UseGuards(GoogleOAuthGuard)
  async googleCallback(@OAuthProfile() profile: GoogleProfile) {
    const receipt = await this.oauthHandler.handle({
      email: profile.email,
      provider: "google",
      providerId: profile.sub,
    });
    return { token: receipt.token, expiresAt: receipt.expiresAt };
  }
}
```

If OAuth is not included in `modules`, calling `handle` throws immediately.

---

## Customising token extraction

Default: `Bearer <token>` from `Authorization` header. Override by extending `AuthTokenExtractor`:

```ts
import { AuthTokenExtractor } from "@odysseon/whoami-adapter-nestjs";

class CookieTokenExtractor extends AuthTokenExtractor {
  extract(request: unknown): string | null {
    const req = request as { cookies?: { token?: string } };
    return req.cookies?.token ?? null;
  }
}

WhoamiModule.registerAsync({
  useFactory: () => ({
    modules: [...],
    receiptVerifier: verifier,
    tokenExtractor: new CookieTokenExtractor(),
  }),
});
```

---

## HTTP status mapping

`WhoamiExceptionFilter` catches every `DomainError` and maps its semantic `category` to the appropriate HTTP response:

| Domain error category | HTTP status               |
| --------------------- | ------------------------- |
| `BAD_REQUEST`         | 400 Bad Request           |
| `UNAUTHORIZED`        | 401 Unauthorized          |
| `NOT_FOUND`           | 404 Not Found             |
| `CONFLICT`            | 409 Conflict              |
| `UNPROCESSABLE`       | 422 Unprocessable Entity  |
| `INTERNAL`            | 500 Internal Server Error |

_Note: `WhoamiAuthGuard` intercepts `InvalidReceiptError` and throws a NestJS `UnauthorizedException` before the exception filter sees it._

---

See [EXAMPLES.md](EXAMPLES.md) for complete wiring examples, and [example-nestjs](../example-nestjs/README.md) for a full reference application.
