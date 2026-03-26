# @odysseon/whoami-adapter-nestjs

NestJS integration package for `@odysseon/whoami-core`.

## Overview

This package provides a dynamic NestJS module (`WhoamiModule`) that bridges the pure core library with NestJS's dependency injection, logging, and HTTP lifecycle.

Out of the box, the module gives you:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/oauth` (Unified endpoint for all OAuth providers)
- `GET /auth/status`

### Secure By Default

When imported, this module automatically registers a global `WhoamiExceptionFilter` to map core domain errors to standard HTTP status codes, and a global `WhoamiAuthGuard` to lock down your application.

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-nestjs
# Plus your preferred cryptography adapters:
npm install @odysseon/whoami-adapter-argon2 @odysseon/whoami-adapter-jose @odysseon/whoami-adapter-webcrypto
```

## Usage

Register the module globally in your `AppModule` using `registerAsync`. This allows you to inject configuration services easily.

```ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { WhoamiModule } from "@odysseon/whoami-adapter-nestjs";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { JoseTokenSigner } from "@odysseon/whoami-adapter-jose";
import { WebCryptoTokenHasher } from "@odysseon/whoami-adapter-webcrypto";

import { PrismaPasswordUserRepository } from "./repositories/password-user.repository";
import { PrismaOAuthUserRepository } from "./repositories/oauth-user.repository";
import { PrismaRefreshTokenRepository } from "./repositories/refresh-token.repository";

@Module({
  imports: [
    ConfigModule.forRoot(),
    WhoamiModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        configuration: {
          authMethods: { credentials: true, oauth: true },
          refreshTokens: { enabled: true, refreshTokenTtlSeconds: 604800 },
          accessTokenTtlSeconds: 3600,
        },
        tokenSigner: new JoseTokenSigner({ secret: config.get("JWT_SECRET")! }),
        passwordHasher: new Argon2PasswordHasher(),
        tokenHasher: new WebCryptoTokenHasher(),
        passwordUserRepository: new PrismaPasswordUserRepository(),
        oauthUserRepository: new PrismaOAuthUserRepository(),
        refreshTokenRepository: new PrismaRefreshTokenRepository(),
      }),
    }),
  ],
})
export class AppModule {}
```

### Protecting and Exposing Routes

Because `WhoamiAuthGuard` is registered globally, all routes are protected by default. To expose a route (like a public landing page or custom login view), use the `@Public()` decorator.

To access the verified user's identity inside a protected route, use the `@CurrentIdentity()` decorator.

```ts
import { Controller, Get } from "@nestjs/common";
import { Public, CurrentIdentity } from "@odysseon/whoami-adapter-nestjs";
import type { IJwtPayload } from "@odysseon/whoami-core";

@Controller("account")
export class AccountController {
  // This route is fully protected by the global Guard
  @Get("me")
  getProfile(@CurrentIdentity() identity: IJwtPayload) {
    return {
      message: "Welcome to your secure dashboard",
      userId: identity.sub, // The user ID guaranteed by the core
    };
  }

  // You can also pluck specific payload properties
  @Get("settings")
  getSettings(@CurrentIdentity("sub") userId: string) {
    return this.settingsService.findByUserId(userId);
  }

  // This route bypasses the global Guard
  @Public()
  @Get("landing")
  getLandingPage() {
    return "Hello World";
  }
}
```

### Customization

- **Token Extraction:** The module defaults to `BearerTokenExtractor`. If your app reads tokens from cookies or custom headers, implement `ITokenExtractor` and pass it to the `useFactory` options as `tokenExtractor`.
- **OAuth Flexibility:** The `/auth/oauth` endpoint accepts a generic `provider` and `providerId`. It is your infrastructure's responsibility (e.g., using Passport.js) to verify the Google/GitHub token first, and then forward the unique provider ID to this endpoint to establish the internal session.
