# @odysseon/whoami-adapter-nestjs

NestJS integration package for `@odysseon/whoami-core`.

## Overview

This package provides a NestJS module that initializes `WhoamiService` with default adapters from the Whoami ecosystem and, by default, exposes a working auth controller plus access-token guard utilities.

Out of the box, the module gives you:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/google`
- `GET /auth/status`
- `GET /auth/me`

The `GET /auth/me` route uses the built-in bearer-token extractor and confirms identity from the access token. The guaranteed baseline is `sub`. `GET /auth/status` exposes which auth methods and token strategy are enabled. Any richer user-loading logic remains the responsibility of the consumer app.

Configuration is authoritative:

- `configuration.authMethods.credentials` must be explicitly `true` to enable credentials auth
- `configuration.authMethods.googleOAuth` must be explicitly `true` to enable Google OAuth
- `configuration.refreshTokens.enabled` must be explicitly `true` to enable refresh tokens
- Supplying providers without matching explicit configuration fails fast with `INVALID_CONFIGURATION`

Default security adapters wired by `WhoamiModule`:

- `@odysseon/whoami-adapter-argon2` (password hasher)
- `@odysseon/whoami-adapter-jose` (access token signer)
- `@odysseon/whoami-adapter-webcrypto` (refresh token hasher)

Supported optional integrations:

- `IEmailUserRepository` for credentials auth
- `IGoogleUserRepository` plus `IGoogleIdTokenVerifier` for Google OAuth
- `IRefreshTokenRepository` for refresh-token rotation when refresh tokens are enabled

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-nestjs @odysseon/whoami-adapter-argon2 @odysseon/whoami-adapter-jose @odysseon/whoami-adapter-webcrypto
```

## Usage

```ts
import { Module } from "@nestjs/common";
import { WhoamiModule } from "@odysseon/whoami-adapter-nestjs";
import { PrismaRefreshTokenRepository } from "./refresh-token.repository";
import { PrismaUserRepository } from "./user.repository";

@Module({
  imports: [
    WhoamiModule.register({
      userRepository: PrismaUserRepository,
      refreshTokenRepository: PrismaRefreshTokenRepository,
      tokenSignerOptions: {
        secret: process.env.JWT_SECRET!,
        issuer: "your-app",
        audience: "your-app-users",
      },
      configuration: {
        authMethods: {
          credentials: true,
          googleOAuth: false,
        },
        refreshTokens: {
          enabled: true,
        },
      },
    }),
  ],
})
export class AppModule {}
```

### Default HTTP surface

That is enough to expose a working controller at `/auth`.

For Google-only auth without refresh tokens:

```ts
WhoamiModule.register({
  googleUserRepository: YourGoogleUserRepository,
  googleIdTokenVerifier: YourGoogleIdTokenVerifier,
  tokenSignerOptions: {
    secret: process.env.JWT_SECRET!,
  },
  configuration: {
    authMethods: {
      credentials: false,
      googleOAuth: true,
    },
    refreshTokens: {
      enabled: false,
    },
  },
});
```

To protect your own routes, use `WhoamiAuthGuard` and `WhoamiIdentity()`:

```ts
import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  WhoamiAuthGuard,
  WhoamiIdentity,
  type WhoamiRequestIdentity,
} from "@odysseon/whoami-adapter-nestjs";

@Controller("account")
export class AccountController {
  @Get("me")
  @UseGuards(WhoamiAuthGuard)
  me(@WhoamiIdentity() identity: WhoamiRequestIdentity) {
    return {
      sub: identity.sub,
    };
  }
}
```

If your app extends the base user model or operation contracts, override the built-in controller and inject the re-exported `WhoamiService` from this package. The built-in controller intentionally stays on the base contracts only.

### Async configuration

```ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { WhoamiModule } from "@odysseon/whoami-adapter-nestjs";
import { PrismaUserRepository } from "./user.repository";

@Module({
  imports: [
    ConfigModule.forRoot(),
    WhoamiModule.registerAsync({
      imports: [ConfigModule],
      userRepository: {
        useClass: PrismaUserRepository,
      },
      configuration: {
        useValue: {
          authMethods: {
            credentials: true,
            googleOAuth: false,
          },
          refreshTokens: {
            enabled: false,
          },
        },
      },
      tokenSignerOptions: {
        useFactory: (config: ConfigService) => ({
          secret: config.get<string>("JWT_SECRET")!,
        }),
        inject: [ConfigService],
      },
    }),
  ],
})
export class AppModule {}
```

## Customization

- Override `tokenExtractor` if your app reads access tokens somewhere other than the `Authorization: Bearer <token>` header.
- Override `configuration` to explicitly enable or disable credentials auth, Google OAuth, and refresh tokens.
- Set `controller: false` if you want only the providers and guard utilities, without the built-in controller.
- Set `controller.path` to move the built-in controller away from `/auth`.
