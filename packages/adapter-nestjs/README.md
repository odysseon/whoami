# @odysseon/whoami-adapter-nestjs

NestJS integration package for `@odysseon/whoami-core`.

## Overview

This package provides a NestJS module that initializes `WhoamiService` with default adapters from the Whoami ecosystem and, by default, exposes a working auth controller plus access-token guard utilities.

Out of the box, the module gives you:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`

The `GET /auth/me` route uses the built-in bearer-token extractor and confirms identity from the access token. The guaranteed baseline is `sub`. Any richer user-loading logic remains the responsibility of the consumer app.

Default security adapters wired by `WhoamiModule`:

- `@odysseon/whoami-adapter-argon2` (password hasher)
- `@odysseon/whoami-adapter-jose` (access token signer)
- `@odysseon/whoami-adapter-webcrypto` (refresh token hasher)

Required repository implementations:

- `IEmailUserRepository` (throwing if one does not exist)
- `IRefreshTokenRepository` (for refresh token storage + rotation)

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-nestjs @odysseon/whoami-adapter-argon2 @odysseon/whoami-adapter-jose @odysseon/whoami-adapter-webcrypto
```

## Usage

```ts
import { Module } from "@nestjs/common";
import { WhoamiModule } from "@odysseon/whoami-adapter-nestjs";
import { PrismaUserRepository } from "./user.repository"; // your implementation
import { PrismaRefreshTokenRepository } from "./refresh-token.repository";

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
    }),
  ],
})
export class AppModule {}
```

### Default HTTP surface

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
      },
    }),
  ],
})
export class AppModule {}
```

That is enough to expose a working controller at `/auth`.

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

### Async configuration (environment-driven)

For configuration that depends on other providers or environment variables:

```ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { WhoamiModule } from "@odysseon/whoami-adapter-nestjs";
import { PrismaUserRepository } from "./user.repository";
import { PrismaRefreshTokenRepository } from "./refresh-token.repository";

@Module({
  imports: [
    ConfigModule.forRoot(),
    WhoamiModule.registerAsync({
      imports: [ConfigModule], // Required for ConfigService injection
      userRepository: {
        useClass: PrismaUserRepository,
      },
      refreshTokenRepository: {
        useClass: PrismaRefreshTokenRepository,
      },
      tokenSignerOptions: {
        useFactory: (config: ConfigService) => ({
          secret: config.get<string>("JWT_SECRET")!,
          issuer: config.get<string>("JWT_ISSUER", "your-app"),
          audience: config.get<string>("JWT_AUDIENCE", "your-app-users"),
        }),
        inject: [ConfigService],
      },
    }),
  ],
})
export class AppModule {}
```

**Note:** The `imports` option is required when using `inject` with tokens from other modules (e.g., ConfigModule). This ensures that the injected services are available in the dynamic module's dependency injection scope.

## Customization

- Override `tokenExtractor` if your app reads access tokens somewhere other than the `Authorization: Bearer <token>` header.
- Set `controller: false` if you want only the providers and guard utilities, without the built-in controller.
- Set `controller.path` to move the built-in controller away from `/auth`.
