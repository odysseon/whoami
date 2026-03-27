# @odysseon/whoami-adapter-nestjs

NestJS receipt-auth integration package for `@odysseon/whoami-core`.

## Overview

This package provides a dynamic NestJS module (`WhoamiModule`) that bridges the feature-first core receipt API with NestJS's dependency injection and HTTP lifecycle.

When imported, the module registers a `VerifyReceiptUseCase`, a default `BearerTokenExtractor`, and a `WhoamiExceptionFilter`. The `WhoamiAuthGuard` can then protect routes using verified receipt tokens from the core `receipts` feature.

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-nestjs
npm install @odysseon/whoami-adapter-jose
```

## Usage

Register the module globally in your `AppModule` using `registerAsync`.

```ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { WhoamiModule } from "@odysseon/whoami-adapter-nestjs";
import { JoseReceiptCodec } from "@odysseon/whoami-adapter-jose";

@Module({
  imports: [
    ConfigModule.forRoot(),
    WhoamiModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        receiptVerifier: new JoseReceiptCodec({
          secret: config.get("JWT_SECRET")!,
        }),
      }),
    }),
  ],
})
export class AppModule {}
```

### Protecting and Exposing Routes

To access the verified receipt identity inside a protected route, use the `WhoamiAuthGuard` together with the `@CurrentIdentity()` decorator.

```ts
import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  CurrentIdentity,
  Public,
  WhoamiAuthGuard,
} from "@odysseon/whoami-adapter-nestjs";
import type { Receipt } from "@odysseon/whoami-core";

@Controller("account")
export class AccountController {
  @UseGuards(WhoamiAuthGuard)
  @Get("me")
  getProfile(@CurrentIdentity() identity: Receipt) {
    return {
      message: "Welcome to your secure dashboard",
      userId: identity.accountId.value,
    };
  }

  @Get("settings")
  @UseGuards(WhoamiAuthGuard)
  getSettings(@CurrentIdentity("accountId") accountId: Receipt["accountId"]) {
    const userId = String(accountId.value);
    return this.settingsService.findByUserId(userId);
  }

  @Public()
  @Get("landing")
  getLandingPage() {
    return "Hello World";
  }
}
```

### Customization

- **Token Extraction:** The module defaults to `BearerTokenExtractor`. If your app reads tokens from cookies or custom headers, implement `AuthTokenExtractor` and pass it to the `useFactory` options as `tokenExtractor`.
- **Receipt Verification:** Supply any `ReceiptVerifier` implementation from your chosen cryptography adapter.
