# @odysseon/whoami-adapter-nestjs

NestJS integration for `@odysseon/whoami-core`. Provides `WhoamiModule`, a global dynamic module that wires auth modules into the NestJS DI container — with the guard and exception filter auto-registered.

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-nestjs
npm install @odysseon/whoami-adapter-jose          # receipt signing
npm install @odysseon/whoami-adapter-argon2         # password hashing (if using password auth)
npm install @odysseon/whoami-adapter-webcrypto      # secure token hashing (if using magic links or password reset)
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
import { VerifyReceiptUseCase } from "@odysseon/whoami-core/internal";

@Module({
  imports: [
    ConfigModule.forRoot(),
    WhoamiModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get("JWT_SECRET")!;
        const signer = new JoseReceiptSigner({ secret, issuer: "my-app" });
        const verifier = new JoseReceiptVerifier({ secret, issuer: "my-app" });

        return {
          modules: [
            PasswordModule({
              accountRepo: new MyAccountRepository(),
              passwordStore: new MyPasswordCredentialStore(),
              passwordHasher: new Argon2PasswordHasher(),
              receiptSigner: signer,
              idGenerator: () => crypto.randomUUID(),
              logger: console,
            }),
            OAuthModule({
              accountRepo: new MyAccountRepository(),
              oauthStore: new MyOAuthCredentialStore(),
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

`WhoamiModule` is `@Global()`. `WhoamiAuthGuard` and `WhoamiExceptionFilter` are registered automatically — do **not** add them via `APP_GUARD` or `APP_FILTER` yourself.

---

## WhoamiModuleOptions

| Option            | Type                    | Required | Description                                                                       |
| ----------------- | ----------------------- | -------- | --------------------------------------------------------------------------------- |
| `modules`         | `readonly AuthModule[]` | ✅       | Auth modules to register (e.g. `PasswordModule(...)`, `OAuthModule(...)`)         |
| `receiptVerifier` | `ReceiptVerifier`       | ✅       | Verifies incoming receipt tokens — use `JoseReceiptVerifier`                      |
| `tokenExtractor`  | `AuthTokenExtractor`    | ✗        | Override token extraction (default: `Bearer <token>` from `Authorization` header) |

---

## Protecting routes

Every route is protected by default. Mark public routes with `@Public()`:

```ts
import { Controller, Get, Post, Body } from "@nestjs/common";
import { Public, CurrentReceipt } from "@odysseon/whoami-adapter-nestjs";
import type { Receipt } from "@odysseon/whoami-core";

@Controller("me")
export class ProfileController {
  @Get()
  getProfile(@CurrentReceipt() receipt: Receipt) {
    return { accountId: receipt.accountId.value };
  }

  @Public()
  @Get("ping")
  ping() {
    return "pong";
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

| Decorator           | Description                                              |
| ------------------- | -------------------------------------------------------- |
| `@Public()`         | Bypasses `WhoamiAuthGuard` on a route or controller      |
| `@CurrentReceipt()` | Resolves the verified `Receipt` from the current request |
| `@CurrentAccount()` | Resolves `accountId` from the current request's receipt  |

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

`WhoamiExceptionFilter` catches every `DomainError` and maps it to the appropriate HTTP response:

| Domain error code               | HTTP status               |
| ------------------------------- | ------------------------- |
| `AUTHENTICATION_ERROR`          | 401 Unauthorized          |
| `INVALID_RECEIPT`               | 401 Unauthorized          |
| `ACCOUNT_ALREADY_EXISTS`        | 409 Conflict              |
| `CREDENTIAL_ALREADY_EXISTS`     | 409 Conflict              |
| `INVALID_EMAIL`                 | 400 Bad Request           |
| `WRONG_CREDENTIAL_TYPE`         | 400 Bad Request           |
| `INVALID_ACCOUNT_ID`            | 400 Bad Request           |
| `INVALID_CREDENTIAL_ID`         | 400 Bad Request           |
| `INVALID_CREDENTIAL`            | 400 Bad Request           |
| `UNSUPPORTED_AUTH_METHOD`       | 400 Bad Request           |
| `ACCOUNT_NOT_FOUND`             | 404 Not Found             |
| `OAUTH_PROVIDER_NOT_FOUND`      | 404 Not Found             |
| `CANNOT_REMOVE_LAST_CREDENTIAL` | 422 Unprocessable Entity  |
| `INVALID_CONFIGURATION`         | 500 Internal Server Error |

---

See [EXAMPLES.md](EXAMPLES.md) for complete wiring examples, and [example-nestjs](../example-nestjs/README.md) for a full reference application.
