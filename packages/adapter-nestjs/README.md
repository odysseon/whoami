# @odysseon/whoami-adapter-nestjs

NestJS receipt-auth integration for `@odysseon/whoami-core`.

## Overview

This package provides a dynamic NestJS module (`WhoamiModule`) that wires the core receipt verification API into NestJS's dependency injection and HTTP lifecycle. When registered it installs:

- `VerifyReceiptUseCase` — verifies receipt tokens through the supplied `ReceiptVerifier`
- `BearerTokenExtractor` — extracts `Bearer <token>` from the `Authorization` header (overridable)
- `WhoamiExceptionFilter` — maps core `DomainError` subclasses to the correct HTTP status codes

The `WhoamiAuthGuard` can then be registered globally (via `APP_GUARD`) to protect every route by default, with `@Public()` used to opt individual routes out.

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-nestjs
# plus a receipt-verifier adapter:
npm install @odysseon/whoami-adapter-jose
```

## Usage

### 1. Register `WhoamiModule` and the global guard

```ts
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

### 2. Access the verified identity inside a route

```ts
import { Controller, Get } from "@nestjs/common";
import { CurrentIdentity, Public } from "@odysseon/whoami-adapter-nestjs";
import type { Receipt } from "@odysseon/whoami-core";

@Controller("account")
export class AccountController {
  @Get("me")
  getProfile(@CurrentIdentity() identity: Receipt) {
    return { accountId: identity.accountId.value };
  }

  @Public()
  @Get("landing")
  getLandingPage() {
    return "Hello World";
  }
}
```

## HTTP Status Mapping

`WhoamiExceptionFilter` translates core domain errors automatically:

| Domain error                | HTTP status               |
| --------------------------- | ------------------------- |
| `AuthenticationError`       | 401 Unauthorized          |
| `InvalidReceiptError`       | 401 Unauthorized          |
| `AccountAlreadyExistsError` | 409 Conflict              |
| `InvalidEmailError`         | 400 Bad Request           |
| `InvalidConfigurationError` | 500 Internal Server Error |
| Any other `DomainError`     | 400 Bad Request           |

## Customising Token Extraction

The module defaults to extracting `Bearer <token>` from the `Authorization` header. To read tokens from cookies or a custom header, implement `AuthTokenExtractor` and pass it as `tokenExtractor`:

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
