# @odysseon/whoami-adapter-nestjs

NestJS integration package for `@odysseon/whoami-core`.

## Overview

This package provides a Nest provider module that initializes `WhoamiService` with default adapters from the Whoami ecosystem and your own repository implementations.

It does not own or enforce any HTTP layer, DTO validations, or routing conventions. Those are intentionally left to your app (Nest controllers/guards/pipes) to keep this package minimal and flexible.

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
